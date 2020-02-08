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

impl From<serde_json::error::Error> for APIError {
  fn from( serde_error : serde_json::error::Error ) -> Self {
    APIError(serde_error.to_string())
  }
}

impl From<APIError> for JsValue {
  fn from( err : APIError ) -> Self {
    err.0.into()
  }
}

#[derive(Deserialize)]
struct SPDConfig {
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

  pub fiber_coupling: bool,
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

fn parse_spdc_setup( cfg : &JsValue ) -> Result<SPDCSetup, APIError> {
  let spd_config : SPDConfig = cfg.into_serde()?;

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
    fiber_coupling : true, // spd_config.fiber_coupling,
    pump_bandwidth : spd_config.pump_bandwidth * NANO * M,
    pump_spectrum_threshold: spd_config.pump_spectrum_threshold,
    // z0p: spd_config.z0p * MICRO * M,
    // z0s: spd_config.signal_waist_position * MICRO * M,
    // z0i: spd_config.signal_waist_position * MICRO * M,
    ..SPDCSetup::default()
  };

  // params.assign_optimum_idler();

  Ok(params)
}

fn parse_time_steps( cfg : &JsValue, prefix : f64 ) -> Result<Steps<Time>, APIError> {
  let ts : TimeSteps = cfg.into_serde()?;

  Ok(Steps(ts.min * prefix * S, ts.max * prefix * S, ts.steps))
}



#[wasm_bindgen]
pub fn get_all_crystal_meta() -> Result<JsValue, JsValue> {
  Ok(JsValue::from_serde(&Crystal::get_all_meta()).unwrap())
}

#[wasm_bindgen]
pub fn get_optimum_idler( spd_config_raw : &JsValue ) -> Result<JsValue, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let idler_data = PhotonData::from_photon(&params.idler, &params.crystal_setup);
  Ok(JsValue::from_serde(&idler_data).unwrap())
}

#[wasm_bindgen]
pub fn get_jsi_data( spd_config_raw : &JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;
  let data = spdcalc::plotting::plot_jsi(&params, &integration_config.into(), None);

  Ok(data)
}

#[wasm_bindgen]
pub fn calculate_crystal_theta( spd_config_raw : &JsValue ) -> Result<f64, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let degrees = *(params.calc_optimum_crystal_theta() / DEG);
  Ok( degrees )
}

/// Returns periodic poling period in units of microns
#[wasm_bindgen]
pub fn calculate_periodic_poling( spd_config_raw : &JsValue ) -> Result<Option<f64>, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let period = params.calc_optimum_periodic_poling().map_err(|e| APIError::from(e))?
    .map(|pp| *(pp.period / (MICRO * M)));
  Ok( period )
}

/// Returns optimal signal waist position in microns
#[wasm_bindgen]
pub fn get_waist_positions( spd_config_raw : &JsValue ) -> Result<Vec<f64>, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let z0s = params.get_signal_waist_position() / (MICRO * M);
  let z0i = params.get_idler_waist_position() / (MICRO * M);
  Ok( vec![*z0s, *z0i] )
}

/// get the indices of refraction for the pump, signal, idler, in that order
#[wasm_bindgen]
pub fn get_refractive_indices( spd_config_raw : &JsValue ) -> Result<Vec<f64>, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let np = *params.pump.get_index(&params.crystal_setup);
  let ns = *params.signal.get_index(&params.crystal_setup);
  let ni = *params.idler.get_index(&params.crystal_setup);
  Ok( vec![np, ns, ni] )
}

/// returns the autocomputed ranges for jsi plot
#[wasm_bindgen]
pub fn calculate_jsi_plot_ranges( spd_config_raw : &JsValue ) -> Result<JsValue, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  // size is ignored
  let steps = spdcalc::plotting::calc_plot_config_for_jsi( &params, 0, 0.5 );

  let ret : IntegrationConfig = steps.into();
  Ok( JsValue::from_serde(&ret).unwrap() )
}

#[wasm_bindgen]
pub fn get_hom_series_data( spd_config_raw : &JsValue, integration_config :IntegrationConfig, time_steps_femto_raw : &JsValue ) -> Result<Vec<f64>, JsValue> {
  let time_steps = parse_time_steps( &time_steps_femto_raw, FEMTO )?;
  let params = parse_spdc_setup( &spd_config_raw )?;
  let data = spdcalc::plotting::calc_HOM_rate_series(&params, &integration_config.into(), &time_steps);

  Ok(data)
}

#[wasm_bindgen]
pub fn get_heralding_results( spd_config_raw : &JsValue, integration_config :IntegrationConfig) -> Result<JsValue, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;
  let ret = calc_heralding_results(&params, &integration_config.into());

  Ok( JsValue::from_serde(&ret).unwrap() )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_waist(
  spd_config_raw : &JsValue,
  integration_config :IntegrationConfig,
  waist_steps_microns_raw : &JsValue
) -> Result<JsValue, JsValue> {
  let mut params = parse_spdc_setup( &spd_config_raw )?;
  let waist_steps_microns : Steps<f64> = waist_steps_microns_raw.into_serde().map_err(|e| e.to_string())?;

  let ret : Vec<HeraldingResults> = waist_steps_microns.into_iter().map(move |waist| {
    let w = Meter::new(Vector2::new(waist, waist) * MICRO);
    params.signal.waist = w;
    params.idler.waist = w;

    calc_heralding_results(&params, &integration_config.into())
  }).collect();

  Ok( JsValue::from_serde(&ret).unwrap() )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_signal_theta(
  spd_config_raw : &JsValue,
  integration_config :IntegrationConfig,
  theta_steps_deg_raw : &JsValue
) -> Result<JsValue, JsValue> {
  let mut params = parse_spdc_setup( &spd_config_raw )?;
  let theta_steps_deg : Steps<f64> = theta_steps_deg_raw.into_serde().map_err(|e| e.to_string())?;

  let ret : Vec<HeraldingResults> = theta_steps_deg.into_iter().map(move |theta| {
    params.signal_fiber_theta_offset = theta * DEG - params.signal.get_theta();
    calc_heralding_results(&params, &integration_config.into())
  }).collect();

  Ok( JsValue::from_serde(&ret).unwrap() )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_idler_theta(
  spd_config_raw : &JsValue,
  integration_config :IntegrationConfig,
  theta_steps_deg_raw : &JsValue
) -> Result<JsValue, JsValue> {
  let mut params = parse_spdc_setup( &spd_config_raw )?;
  let theta_steps_deg : Steps<f64> = theta_steps_deg_raw.into_serde().map_err(|e| e.to_string())?;

  let ret : Vec<HeraldingResults> = theta_steps_deg.into_iter().map(move |theta| {
    params.idler_fiber_theta_offset = theta * DEG - params.idler.get_theta();
    calc_heralding_results(&params, &integration_config.into())
  }).collect();

  Ok( JsValue::from_serde(&ret).unwrap() )
}

#[wasm_bindgen]
pub fn get_heralding_results_signal_vs_idler_waists(
  spd_config_raw : &JsValue,
  integration_config :IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<JsValue, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;
  let ret = plot_heralding_results_by_signal_idler_waist(
    &params,
    &waist_ranges.into(),
    &integration_config.into(),
  );

  Ok( JsValue::from_serde(&ret).unwrap() )
}

#[wasm_bindgen]
pub fn get_heralding_results_pump_vs_signal_idler_waists(
  spd_config_raw : &JsValue,
  integration_config :IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<JsValue, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;
  let ret = plot_heralding_results_by_pump_signal_idler_waist(
    &params,
    &waist_ranges.into(),
    &integration_config.into(),
  );

  Ok( JsValue::from_serde(&ret).unwrap() )
}


#[wasm_bindgen]
pub fn get_jsi_coinc_normalized_to_singles_data( spd_config_raw : &JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let data = spdcalc::plotting::calc_coincidences_rate_distribution(&params, &integration_config.into());

  Ok(
    data.iter().map(|i| *(*i * S)).collect()
  )
}

#[wasm_bindgen]
pub fn get_jsi_singles_signal_data( spd_config_raw : &JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let data = spdcalc::plotting::calc_singles_rate_distribution_signal(&params, &integration_config.into());

  Ok(
    data.iter().map(|i| *(*i * S)).collect()
  )
}

#[wasm_bindgen]
pub fn get_jsi_singles_idler_data( spd_config_raw : &JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsValue> {
  let params = parse_spdc_setup( &spd_config_raw )?;

  let data = spdcalc::plotting::calc_singles_rate_distribution_signal(&params.with_swapped_signal_idler(), &integration_config.into());

  Ok(
    data.iter().map(|i| *(*i * S)).collect()
  )
}
