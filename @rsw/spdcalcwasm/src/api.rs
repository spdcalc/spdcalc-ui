use wasm_bindgen::prelude::*;
extern crate spdcalc;

use spdcalc::na::Vector2;
use spdcalc::{
  Time,
  dim::{
    f64prefixes::{MICRO, NANO, FEMTO},
    ucum::{DEG, M, S, Meter},
  },
  types::{Wavelength},
  utils::{Steps, Steps2D},
  photon::{Photon, PhotonType},
  crystal::*,
  spdc_setup::SPDCSetup,
  spdc_setup::PeriodicPoling,
  plotting::{
    HeraldingResults,
    calc_heralding_results,
    plot_heralding_results_by_signal_idler_waist,
    plot_heralding_results_by_pump_signal_idler_waist,
  },
};

struct APIError(String);

impl From<spdcalc::SPDCError> for APIError {
  fn from( err : spdcalc::SPDCError ) -> Self {
    Self(err.0)
  }
}

impl From<serde_wasm_bindgen::Error> for APIError {
  fn from( serde_error : serde_wasm_bindgen::Error ) -> Self {
    APIError(serde_error.to_string())
  }
}

impl From<APIError> for JsError {
  fn from( err : APIError ) -> Self {
    // wasm_bindgen::wasm_error(err)
    JsError::new(&err.0)
  }
}

#[derive(Deserialize)]
pub struct SPDConfig {
  // All angles in degrees
  pub crystal : String,
  pub pm_type : String,
  pub crystal_theta: f64,
  pub crystal_phi: f64,
  pub crystal_length: f64, // microns
  pub crystal_temperature: f64, // celsius

  pub pump_wavelength: f64, // nm
  pub pump_bandwidth: f64, // nm
  pub pump_waist: f64, // microns
  pub pump_spectrum_threshold: f64, // unitless

  pub signal_wavelength: f64, // nm
  pub signal_theta: f64, // external theta degrees
  pub signal_phi: f64, // deg
  pub signal_bandwidth: f64, // nm
  pub signal_waist: f64, // microns
  // pub signal_waist_position: f64, // microns

  // -- ignored... optimum idler computed --
  pub idler_wavelength: f64, // nm
  pub idler_theta: f64,
  pub idler_phi: f64,
  pub idler_bandwidth: f64, // nm
  pub idler_waist: f64, // microns
  // -- --

  pub periodic_poling_enabled: bool,
  pub poling_period: f64, // microns

  pub apodization_enabled: bool,
  pub apodization_fwhm: f64, // microns

  pub fiber_coupling: Option<bool>,
}

#[wasm_bindgen]
#[derive(Copy, Clone, Serialize)]
pub struct IntegrationConfig {
  // nanometers
  pub ls_min : f64,
  pub ls_max : f64,
  pub li_min : f64,
  pub li_max : f64,

  // dimension of histogram
  pub size : usize,
}

#[wasm_bindgen]
impl IntegrationConfig {
  pub fn new(ls_min : f64, ls_max : f64, li_min : f64, li_max : f64, size : usize) -> Self {
    IntegrationConfig {
      ls_min,
      ls_max,
      li_min,
      li_max,
      size,
    }
  }

  pub fn transposed(&self) -> Self {
    Self {
      ls_min: self.li_min,
      ls_max: self.li_max,
      li_min: self.ls_min,
      li_max: self.ls_max,
      size: self.size
    }
  }
}

impl From<IntegrationConfig> for Steps2D<Wavelength> {
  fn from(cfg : IntegrationConfig) -> Self {
    Steps2D(
      (cfg.ls_min * NANO * M, cfg.ls_max * NANO * M, cfg.size),
      (cfg.li_min * NANO * M, cfg.li_max * NANO * M, cfg.size),
    )
  }
}

impl From<Steps2D<Wavelength>> for IntegrationConfig {
  fn from(steps2d : Steps2D<Wavelength>) -> Self {
    assert_eq!((steps2d.0).2, (steps2d.1).2);
    Self {
      ls_min: *((steps2d.0).0 / NANO / M),
      ls_max: *((steps2d.0).1 / NANO / M),
      li_min: *((steps2d.1).0 / NANO / M),
      li_max: *((steps2d.1).1 / NANO / M),
      size: (steps2d.0).2
    }
  }
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct WaistRanges {
  // nanometers
  pub wx_min : f64,
  pub wx_max : f64,
  pub wy_min : f64,
  pub wy_max : f64,

  // dimension of histogram
  pub x_size : usize,
  pub y_size : usize,
}

#[wasm_bindgen]
impl WaistRanges {
  pub fn new(wx_min : f64, wx_max : f64, wy_min : f64, wy_max : f64, x_size : usize, y_size : usize) -> Self {
    WaistRanges {
      wx_min,
      wx_max,
      wy_min,
      wy_max,
      x_size,
      y_size,
    }
  }
}

impl From<WaistRanges> for Steps2D<Meter<f64>> {
  fn from(cfg : WaistRanges) -> Self {
    Steps2D(
      (cfg.wx_min * MICRO * M, cfg.wx_max * MICRO * M, cfg.x_size),
      (cfg.wy_min * MICRO * M, cfg.wy_max * MICRO * M, cfg.y_size),
    )
  }
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct Grid2D {
  pub x_min : f64,
  pub x_max : f64,
  pub y_min : f64,
  pub y_max : f64,

  // dimension of histogram
  pub x_size : usize,
  pub y_size : usize,
}

#[wasm_bindgen]
impl Grid2D {
  pub fn new(x_min : f64, x_max : f64, y_min : f64, y_max : f64, x_size : usize, y_size : usize) -> Self {
    Grid2D {
      x_min,
      x_max,
      y_min,
      y_max,
      x_size,
      y_size,
    }
  }
}

impl<T> From<Grid2D> for Steps2D<T>
  where T : From<f64> {
  fn from(cfg : Grid2D) -> Self {
    Steps2D(
      (cfg.x_min.into(), cfg.x_max.into(), cfg.x_size),
      (cfg.y_min.into(), cfg.y_max.into(), cfg.y_size),
    )
  }
}

// intensity, amplitude, phase
#[wasm_bindgen]
pub struct JointSpectrum {
  spectrum: spdcalc::plotting::JointSpectrum,
  intensities: Vec<f64>,
  amplitudes: Vec<f64>,
  phases: Vec<f64>,
}

#[wasm_bindgen]
impl JointSpectrum {
  pub fn intensities(&self) -> Vec<f64> {
    self.intensities.clone()
  }
  pub fn amplitudes(&self) -> Vec<f64> {
    self.amplitudes.clone()
  }
  pub fn phases(&self) -> Vec<f64> {
    self.phases.clone()
  }
  pub fn schmidt_number(&self) -> Result<f64, JsError> {
    Ok(self.spectrum.schmidt_number().map_err(|e| APIError::from(e))?)
  }
}

impl From<spdcalc::plotting::JointSpectrum> for JointSpectrum {
  fn from(spectrum : spdcalc::plotting::JointSpectrum) -> Self {
    let intensities = spectrum.intensities();
    let (amplitudes, phases) = spectrum.polar_amplitudes().into_iter().unzip();
    Self { spectrum, intensities, amplitudes, phases }
  }
}

#[derive(Serialize, Deserialize)]
struct TimeSteps {
  // Seconds
  pub min : f64,
  pub max : f64,
  pub steps : usize,
}

#[derive(Serialize, Deserialize)]
struct PhotonData {
  pub photon_type : PhotonType,
  pub waist : [f64;2], // microns
  pub wavelength : f64, // nm
  pub theta : f64, // deg
  pub theta_e : f64, // deg
  pub phi : f64, // deg
}

impl PhotonData {
  pub fn from_photon(photon : &Photon, crystal_setup : &CrystalSetup) -> Self {
    let waist = photon.waist / MICRO / M;
    Self {
      photon_type: photon.get_type(),
      waist: [waist.x, waist.y],
      wavelength: *(photon.get_wavelength() / NANO / M),
      theta: *(photon.get_theta() / DEG),
      theta_e: *(photon.get_external_theta(&crystal_setup) / DEG),
      phi: *(photon.get_phi() / DEG),
    }
  }
}

fn parse_spdc_setup( cfg : JsValue ) -> Result<SPDCSetup, APIError> {
  let spd_config : SPDConfig = serde_wasm_bindgen::from_value(cfg)?;

  let crystal = Crystal::from_string( &spd_config.crystal )?;
  let pm_type = spd_config.pm_type.parse()?;

  let crystal_setup = spdcalc::crystal::CrystalSetup {
    crystal,
    pm_type,
    theta :       spd_config.crystal_theta * DEG,
    phi :         spd_config.crystal_phi * DEG,
    length :      spd_config.crystal_length * MICRO * M,
    temperature : spdcalc::utils::from_celsius_to_kelvin(spd_config.crystal_temperature),
  };

  let apodization = if spd_config.apodization_enabled {
    Some(spdcalc::spdc_setup::Apodization{
      fwhm: spd_config.apodization_fwhm * MICRO * M,
    })
  } else {
    None
  };

  let pump = Photon::pump(
    spd_config.pump_wavelength * NANO * M,
    spdcalc::WaistSize::new(spdcalc::na::Vector2::new(spd_config.pump_waist * MICRO, spd_config.pump_waist * MICRO))
  );

  let mut signal = Photon::signal(
    spd_config.signal_phi * DEG,
    0. * DEG,
    spd_config.signal_wavelength * NANO * M,
    spdcalc::WaistSize::new(spdcalc::na::Vector2::new(spd_config.signal_waist * MICRO, spd_config.signal_waist * MICRO))
  );

  signal.set_from_external_theta(spd_config.signal_theta * DEG, &crystal_setup);

  let pp = if spd_config.periodic_poling_enabled {
    if spd_config.poling_period > 0. {
      Some(spdcalc::spdc_setup::PeriodicPoling{
        period: spd_config.poling_period * MICRO * M,
        sign: PeriodicPoling::compute_sign(&signal, &pump, &crystal_setup),
        apodization,
      })
    } else {
      None
    }
  } else {
    None
  };

  let idler = spdcalc::spdc_setup::get_optimum_idler(&signal, &pump, &crystal_setup, pp);
  // Photon::idler(
  //   spd_config.idler_phi * DEG,
  //   0. * DEG,
  //   spd_config.idler_wavelength * NANO * M,
  //   spdcalc::WaistSize::new(spdcalc::na::Vector2::new(spd_config.idler_waist * MICRO, spd_config.idler_waist * MICRO))
  // );
  //
  // idler.set_from_external_theta(spd_config.idler_theta * DEG, &crystal_setup);

  let params = SPDCSetup {
    signal,
    idler,
    pump,
    crystal_setup,
    pp,
    fiber_coupling : spd_config.fiber_coupling.unwrap_or(true),
    pump_bandwidth : spd_config.pump_bandwidth * NANO * M,
    pump_spectrum_threshold: spd_config.pump_spectrum_threshold,
    // z0p: spd_config.z0p * MICRO * M,
    // z0s: spd_config.signal_waist_position * MICRO * M,
    // z0i: spd_config.signal_waist_position * MICRO * M,
    ..SPDCSetup::default()
  };

  // params.assign_optimum_idler();

  // TODO: this is dumb. need to change
  Ok(params.with_optimal_waist_positions())
}

fn parse_time_steps( cfg : JsValue, prefix : f64 ) -> Result<Steps<Time>, APIError> {
  let ts : TimeSteps = serde_wasm_bindgen::from_value(cfg)?;

  Ok(Steps(ts.min * prefix * S, ts.max * prefix * S, ts.steps))
}

#[wasm_bindgen]
pub fn get_all_crystal_meta() -> Result<JsValue, JsError> {
  Ok(serde_wasm_bindgen::to_value(&Crystal::get_all_meta())?)
}

#[wasm_bindgen]
pub fn get_optimum_idler( spd_config_raw : JsValue ) -> Result<JsValue, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  let idler_data = PhotonData::from_photon(&params.idler, &params.crystal_setup);
  Ok(serde_wasm_bindgen::to_value(&idler_data)?)
}

#[wasm_bindgen]
pub fn get_joint_spectrum( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<JointSpectrum, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;
  let f = spdcalc::plotting::JointSpectrum::new_coincidences(params, integration_config.into());
  Ok(f.into())
}

#[wasm_bindgen]
pub fn calculate_crystal_theta( spd_config_raw : JsValue ) -> Result<f64, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  let degrees = *(params.calc_optimum_crystal_theta() / DEG);
  Ok( degrees )
}

/// Returns periodic poling period in units of microns
#[wasm_bindgen]
pub fn calculate_periodic_poling( spd_config_raw : JsValue ) -> Result<Option<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  let period = params.calc_optimum_periodic_poling().map_err(|e| APIError::from(e))?
    .map(|pp| *(pp.period / (MICRO * M)));
  Ok( period )
}

/// Returns optimal signal waist position in microns
#[wasm_bindgen]
pub fn get_waist_positions( spd_config_raw : JsValue ) -> Result<Vec<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  let z0s = params.get_signal_waist_position() / (MICRO * M);
  let z0i = params.get_idler_waist_position() / (MICRO * M);
  Ok( vec![*z0s, *z0i] )
}

/// get the indices of refraction for the pump, signal, idler, in that order
#[wasm_bindgen]
pub fn get_refractive_indices( spd_config_raw : JsValue ) -> Result<Vec<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  let np = *params.pump.get_index(&params.crystal_setup);
  let ns = *params.signal.get_index(&params.crystal_setup);
  let ni = *params.idler.get_index(&params.crystal_setup);
  Ok( vec![np, ns, ni] )
}

/// returns the autocomputed ranges for jsi plot
#[wasm_bindgen]
pub fn calculate_jsi_plot_ranges( spd_config_raw : JsValue ) -> Result<JsValue, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  // size is ignored
  let steps = spdcalc::plotting::calc_plot_config_for_jsi( &params, 0, 0.5 );

  let ret : IntegrationConfig = steps.into();
  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_hom_series_data( spd_config_raw : JsValue, integration_config :IntegrationConfig, time_steps_femto_raw : JsValue ) -> Result<Vec<f64>, JsError> {
  let time_steps = parse_time_steps( time_steps_femto_raw, FEMTO )?;
  let params = parse_spdc_setup( spd_config_raw )?;
  let data = spdcalc::plotting::calc_HOM_rate_series(
    &params,
    &integration_config.into(),
    &time_steps
  );

  Ok(data)
}

#[wasm_bindgen]
pub fn get_hom_visibility(  spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;
  let (delta_t, vis) = spdcalc::plotting::calc_hom_visibility(
    &params,
    &integration_config.into()
  );
  Ok(vec![*(delta_t / S), vis])
}

#[wasm_bindgen]
pub fn get_hom_two_source_series_data( spd_config_raw : JsValue, integration_config :IntegrationConfig, time_steps_femto_raw : JsValue ) -> Result<JsValue, JsError> {
  let time_steps = parse_time_steps( time_steps_femto_raw, FEMTO )?;
  let params = parse_spdc_setup( spd_config_raw )?;
  let data = spdcalc::plotting::calc_HOM_two_source_rate_series(
    &params,
    &params,
    &integration_config.into(),
    &integration_config.into(),
    &time_steps
  );

  Ok( serde_wasm_bindgen::to_value(&data)? )
}


#[wasm_bindgen]
pub fn get_hom_two_source_visibility(  spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;
  let (delta_t, ss, ii, si) = spdcalc::plotting::calc_hom_two_source_visibility(
    &params,
    &params,
    &integration_config.into(),
    &integration_config.into()
  );
  Ok(vec![*(delta_t / S), ss, ii, si])
}

#[wasm_bindgen]
pub fn get_heralding_results( spd_config_raw : JsValue, integration_config :IntegrationConfig) -> Result<JsValue, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;
  let ret = calc_heralding_results(&params, &integration_config.into());

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_waist(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  waist_steps_microns_raw : JsValue
) -> Result<JsValue, JsError> {
  let mut params = parse_spdc_setup( spd_config_raw )?;
  let waist_steps_microns : Steps<f64> = serde_wasm_bindgen::from_value(waist_steps_microns_raw).map_err(APIError::from)?;

  let ret : Vec<HeraldingResults> = waist_steps_microns.into_iter().map(move |waist| {
    let w = Meter::new(Vector2::new(waist, waist) * MICRO);
    params.signal.waist = w;
    params.idler.waist = w;

    calc_heralding_results(&params, &integration_config.into())
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_signal_theta(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  theta_steps_deg_raw : JsValue
) -> Result<JsValue, JsError> {
  let mut params = parse_spdc_setup( spd_config_raw )?;
  let theta_steps_deg : Steps<f64> = serde_wasm_bindgen::from_value(theta_steps_deg_raw).map_err(APIError::from)?;

  let ret : Vec<HeraldingResults> = theta_steps_deg.into_iter().map(move |theta| {
    params.signal_fiber_theta_offset = theta * DEG - params.signal.get_theta();
    calc_heralding_results(&params, &integration_config.into())
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_idler_theta(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  theta_steps_deg_raw : JsValue
) -> Result<JsValue, JsError> {
  let mut params = parse_spdc_setup( spd_config_raw )?;
  let theta_steps_deg : Steps<f64> = serde_wasm_bindgen::from_value(theta_steps_deg_raw).map_err(APIError::from)?;

  let ret : Vec<HeraldingResults> = theta_steps_deg.into_iter().map(move |theta| {
    params.idler_fiber_theta_offset = theta * DEG - params.idler.get_theta();
    calc_heralding_results(&params, &integration_config.into())
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_signal_vs_idler_waists(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<JsValue, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;
  let ret = plot_heralding_results_by_signal_idler_waist(
    &params,
    &waist_ranges.into(),
    &integration_config.into(),
  );

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_pump_vs_signal_idler_waists(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<JsValue, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;
  let ret = plot_heralding_results_by_pump_signal_idler_waist(
    &params,
    &waist_ranges.into(),
    &integration_config.into(),
  );

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}


#[wasm_bindgen]
pub fn get_jsi_coinc_normalized_to_singles_data( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  let data = spdcalc::plotting::calc_coincidences_rate_distribution(&params, &integration_config.into());

  Ok(
    data.iter().map(|i| *(*i * S)).collect()
  )
}

#[wasm_bindgen]
pub fn get_jsi_singles_signal_data( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;

  let data = spdcalc::plotting::calc_singles_rate_distribution_signal(&params, &integration_config.into());

  Ok(
    data.iter().map(|i| *(*i * S)).collect()
  )
}

#[wasm_bindgen]
pub fn get_jsi_singles_idler_data( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsError> {
  let params = parse_spdc_setup( spd_config_raw )?;
  let mut params = params.with_swapped_signal_idler();
  params.assign_optimum_idler();
  let data = spdcalc::plotting::calc_singles_rate_distribution_signal(&params, &integration_config.into());

  Ok(
    data.iter().map(|i| *(*i * S)).collect()
  )
}

#[wasm_bindgen]
pub fn get_schmidt_pump_bw_vs_crystal_length(
  spd_config_raw : JsValue,
  integration_config : IntegrationConfig,
  pump_bw_vs_crystal_len_meters: Grid2D,
) -> Result<JsValue, JsError> {
  let mut params = parse_spdc_setup( spd_config_raw )?;

  let steps : Steps2D<f64> = pump_bw_vs_crystal_len_meters.into();
  let results : Result<Vec<f64>, _> = steps.into_iter().map(|(len, pbw)| {
    params.crystal_setup.length = len * M;
    params.pump_bandwidth = pbw * M;
    spdcalc::plotting::JointSpectrum::new_coincidences(params, integration_config.into()).schmidt_number()
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&results.map_err(APIError::from)?)? )
}
