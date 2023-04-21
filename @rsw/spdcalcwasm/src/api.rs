use wasm_bindgen::prelude::*;
extern crate spdcalc;

use spdcalc::na::Vector2;
use spdcalc::{
  Time,
  PMType,
  dim::{
    f64prefixes::{MICRO, NANO, FEMTO},
    ucum::{DEG, M, S, Meter, MILLIW},
  },
  Photon,
  types::{Wavelength},
  utils::{Steps, Steps2D},
  crystal::*,
  spdc_setup::SPDCSetup,
  PeriodicPoling
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
  pub crystal : Crystal,
  pub pm_type : String,
  pub crystal_theta: f64,
  pub crystal_phi: f64,
  pub crystal_length: f64, // microns
  pub crystal_temperature: f64, // celsius

  pub pump_wavelength: f64, // nm
  pub pump_bandwidth: f64, // nm
  pub pump_waist: f64, // microns
  pub pump_spectrum_threshold: f64, // unitless
  pub pump_power: Option<f64>, // milliwatts

  pub signal_wavelength: f64, // nm
  pub signal_theta: f64, // external theta degrees
  pub signal_phi: f64, // deg
  pub signal_bandwidth: f64, // nm
  pub signal_waist: f64, // microns
  pub signal_waist_position: f64, // microns

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

  pub deff: Option<f64>, // pm/V
}

impl From<SPDConfig> for spdcalc::SPDCConfig {
  fn from(cfg: SPDConfig) -> Self {
    use std::str::FromStr;
    use spdcalc::{CrystalConfig, AutoCalcParam, SignalConfig, PumpConfig, MaybePeriodicPolingConfig, PeriodicPolingConfig};
    let crystal = CrystalConfig {
      name: cfg.crystal,
      pm_type: PMType::from_str(&cfg.pm_type).unwrap(),
      theta_deg: AutoCalcParam::Param(cfg.crystal_theta),
      phi_deg: cfg.crystal_phi,
      length_um: cfg.crystal_length,
      temperature_c: cfg.crystal_temperature,
    };
    let pump = PumpConfig {
      wavelength_nm: cfg.pump_wavelength,
      bandwidth_nm: cfg.pump_bandwidth,
      waist_um: cfg.pump_waist,
      average_power_mw: cfg.pump_power.unwrap_or(300.),
      spectrum_threshold: Some(cfg.pump_spectrum_threshold),
    };
    let signal = SignalConfig {
      wavelength_nm: cfg.signal_wavelength,
      theta_deg: None,
      theta_external_deg: Some(cfg.signal_theta),
      phi_deg: cfg.signal_phi,
      waist_um: cfg.signal_waist,
      waist_position_um: AutoCalcParam::Param(cfg.signal_waist_position),
    };

    let periodic_poling = if cfg.periodic_poling_enabled {
      MaybePeriodicPolingConfig::Config(PeriodicPolingConfig {
        poling_period_um: AutoCalcParam::Param(cfg.poling_period),
        apodization_fwhm_um: if cfg.apodization_enabled { Some(cfg.apodization_fwhm) } else { None },
      })
    } else {
      MaybePeriodicPolingConfig::Off
    };

    let idler = AutoCalcParam::default();
    Self {
      crystal,
      pump,
      signal,
      idler,
      periodic_poling,
      deff_pm_per_volt: cfg.deff.unwrap_or(7.3),
    }
  }
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

  pub fn swapped(&self) -> Self {
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
  schmidt_number: f64,
  intensities: Vec<f64>,
  amplitudes: Vec<f64>,
  phases: Vec<f64>,
}

impl JointSpectrum {
  fn from_spdc<T: spdcalc::jsa::IntoSignalIdlerIterator + Copy + Into<spdcalc::jsa::FrequencySpace>>(spdc : &spdcalc::SPDC, range: T) -> Self {
    let spectrum = spdc.joint_spectrum(None);
    let intensities = spectrum.jsi_normalized_range(range);
    let (amplitudes, phases) = spectrum.jsa_normalized_range(range).iter().map(|c| c.to_polar()).unzip();
    let schmidt_number = spectrum.schmidt_number(range).unwrap();
    Self { schmidt_number, intensities, amplitudes, phases }
  }
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
  pub fn schmidt_number(&self) -> f64 {
    self.schmidt_number
  }
}

impl From<spdcalc::plotting::JointSpectrum> for JointSpectrum {
  fn from(spectrum : spdcalc::plotting::JointSpectrum) -> Self {
    let intensities = spectrum.intensities();
    let (amplitudes, phases) = spectrum.polar_amplitudes().into_iter().unzip();
    let schmidt_number = spectrum.schmidt_number().unwrap();
    Self { schmidt_number, intensities, amplitudes, phases }
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
struct BeamData {
  pub polarization : spdcalc::PolarizationType,
  pub waist : [f64;2], // microns
  pub wavelength : f64, // nm
  pub theta : f64, // deg
  pub theta_e : f64, // deg
  pub phi : f64, // deg
}

impl BeamData {
  pub fn from_beam(beam: &spdcalc::Beam, crystal_setup: &CrystalSetup) -> Self {
    let waist = beam.waist();
    Self {
      polarization: beam.polarization(),
      waist: [*(waist.x / MICRO / M), *(waist.y / MICRO / M)],
      wavelength: *(beam.vacuum_wavelength() / NANO / M),
      theta: *(beam.theta_internal() / DEG),
      theta_e: *(beam.theta_external(&crystal_setup) / DEG),
      phi: *(beam.phi() / DEG),
    }
  }
}

fn get_spdc( cfg: JsValue ) -> Result<spdcalc::SPDC, APIError> {
  let spd_config : SPDConfig = serde_wasm_bindgen::from_value(cfg)?;
  let config : spdcalc::SPDCConfig = spd_config.into();
  let spdc = config.try_as_spdc()?;
  let json = serde_json::to_string_pretty(&spdcalc::SPDCConfig::from(spdc.clone())).map_err(|_| APIError("Problem converting json".into()))?;
  web_sys::console::log_1(&json.into());
  Ok(spdc)
}

fn parse_spdc_setup( cfg : JsValue ) -> Result<SPDCSetup, APIError> {
  let spd_config : SPDConfig = serde_wasm_bindgen::from_value(cfg)?;

  let crystal = spd_config.crystal;
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
    Some(spdcalc::Apodization{
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
      Some(PeriodicPoling{
        period: spd_config.poling_period * MICRO * M,
        sign: (-1).into(),
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
    pump_average_power: 300. * MILLIW,
    // z0p: spd_config.z0p * MICRO * M,
    // z0s: spd_config.signal_waist_position * MICRO * M,
    // z0i: spd_config.signal_waist_position * MICRO * M,
    ..SPDCSetup::default()
  };

  // params.assign_optimum_idler();

  // TODO: this is dumb. need to change
  let params = params.with_optimal_waist_positions();

  Ok(params)
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
  let spdc = get_spdc( spd_config_raw )?;
  let idler = spdcalc::IdlerBeam::try_new_optimum(&spdc.signal, &spdc.pump, &spdc.crystal_setup, spdc.pp)?;
  let idler_data = BeamData::from_beam(&idler, &spdc.crystal_setup);
  Ok(serde_wasm_bindgen::to_value(&idler_data)?)
}

#[wasm_bindgen]
pub fn get_joint_spectrum( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<JointSpectrum, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  Ok(JointSpectrum::from_spdc(&spdc, ranges))
}

#[wasm_bindgen]
pub fn get_joint_spectrum_freq( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<JointSpectrum, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let ranges : spdcalc::jsa::FrequencySpace = ranges.into();
  Ok(JointSpectrum::from_spdc(&spdc, ranges))
}


#[wasm_bindgen]
pub fn get_joint_spectrum_sum_diff( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<JointSpectrum, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let ranges : spdcalc::jsa::SumDiffFrequencySpace = ranges.into();
  Ok(JointSpectrum::from_spdc(&spdc, ranges))
}

#[wasm_bindgen]
pub fn calculate_crystal_theta( spd_config_raw : JsValue ) -> Result<f64, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let degrees = *(spdc.crystal_setup.optimum_theta(&spdc.signal, &spdc.pump) / DEG);
  Ok( degrees )
}

/// Returns periodic poling period in units of microns
#[wasm_bindgen]
pub fn calculate_periodic_poling( spd_config_raw : JsValue ) -> Result<f64, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let period = spdcalc::optimum_poling_period(&spdc.signal, &spdc.pump, &spdc.crystal_setup)
    .map(|period| (period / (MICRO * M)).abs())?;
  Ok( period )
}

/// Returns optimal signal waist position in microns
#[wasm_bindgen]
pub fn get_waist_positions( spd_config_raw : JsValue ) -> Result<Vec<f64>, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let z0s = spdc.crystal_setup.optimal_waist_position(spdc.signal.vacuum_wavelength(), spdc.signal.polarization());
  let z0i = spdc.crystal_setup.optimal_waist_position(spdc.idler.vacuum_wavelength(), spdc.idler.polarization());
  Ok(
    vec![
      *(z0s / (MICRO * M)),
      *(z0i / (MICRO * M))
    ]
  )
}

/// get the indices of refraction for the pump, signal, idler, in that order
#[wasm_bindgen]
pub fn get_refractive_indices( spd_config_raw : JsValue ) -> Result<Vec<f64>, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  Ok(
    vec![
      *spdc.pump.refractive_index(spdc.pump.frequency(), &spdc.crystal_setup),
      *spdc.signal.refractive_index(spdc.signal.frequency(), &spdc.crystal_setup),
      *spdc.idler.refractive_index(spdc.idler.frequency(), &spdc.crystal_setup)
    ]
  )
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
  let spdc = get_spdc( spd_config_raw )?;
  let time_steps = parse_time_steps( time_steps_femto_raw, FEMTO )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  Ok(spdc.hom_rate_series(ranges, time_steps, None))
}

#[wasm_bindgen]
pub fn get_hom_visibility(  spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<Vec<f64>, JsError> {
  let spdc = get_spdc( spd_config_raw.clone() )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let (delta_t, vis) = spdc.hom_visibility(ranges);
  Ok(vec![*(delta_t / S), vis])
}

#[wasm_bindgen]
pub fn get_hom_two_source_series_data( spd_config_raw : JsValue, integration_config :IntegrationConfig, time_steps_femto_raw : JsValue ) -> Result<JsValue, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let time_steps = parse_time_steps( time_steps_femto_raw, FEMTO )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let data = spdc.hom_two_source_rate_series(ranges, time_steps, None);
  Ok( serde_wasm_bindgen::to_value(&data)? )
}


#[wasm_bindgen]
pub fn get_hom_two_source_visibility(  spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<JsValue, JsError> {
  let spdc = get_spdc( spd_config_raw.clone() )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let data = spdc.hom_two_source_visibilities(ranges);
  Ok( serde_wasm_bindgen::to_value(&data)? )
}

#[wasm_bindgen]
pub fn get_heralding_results( spd_config_raw : JsValue, integration_config :IntegrationConfig) -> Result<JsValue, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let data = spdc.efficiencies(ranges, None);
  Ok( serde_wasm_bindgen::to_value(&data)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_waist(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  waist_steps_microns_raw : JsValue
) -> Result<JsValue, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let waist_steps_microns : Steps<f64> = serde_wasm_bindgen::from_value(waist_steps_microns_raw).map_err(APIError::from)?;
  let data : Vec<spdcalc::Efficiencies> = waist_steps_microns.into_iter().map(move |w| {
    spdc.signal.set_waist(w * MICRO * M);
    spdc.idler.set_waist(w * MICRO * M);
    spdc.efficiencies(ranges, None)
  }).collect();
  Ok( serde_wasm_bindgen::to_value(&data)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_signal_theta(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  theta_steps_deg_raw : JsValue
) -> Result<JsValue, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let theta_steps_deg : Steps<f64> = serde_wasm_bindgen::from_value(theta_steps_deg_raw).map_err(APIError::from)?;

  let ret : Vec<spdcalc::Efficiencies> = theta_steps_deg.into_iter().map(move |theta| {
    let theta = theta * DEG;
    spdc.signal.set_theta_external(theta, &spdc.crystal_setup);
    // if spdc.pp.is_some() {
    //   spdc.assign_optimum_periodic_poling().unwrap();
    // }
    // spdc.assign_optimum_idler().unwrap();
    spdc.efficiencies(ranges, None)
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_vs_idler_theta(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  theta_steps_deg_raw : JsValue
) -> Result<JsValue, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let theta_steps_deg : Steps<f64> = serde_wasm_bindgen::from_value(theta_steps_deg_raw).map_err(APIError::from)?;

  let ret : Vec<spdcalc::Efficiencies> = theta_steps_deg.into_iter().map(move |theta| {
    let theta = theta * DEG;
    spdc.idler.set_theta_external(theta, &spdc.crystal_setup);
    // if spdc.pp.is_some() {
    //   spdc.assign_optimum_periodic_poling().unwrap();
    // }
    // spdc.assign_optimum_idler().unwrap();
    spdc.efficiencies(ranges, None)
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_signal_vs_idler_waists(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<JsValue, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let waists : Steps2D<Meter<f64>> = waist_ranges.into();

  let ret : Vec<spdcalc::Efficiencies> = waists.into_iter().map(move |(ws, wi)| {
    spdc.signal.set_waist(ws);
    spdc.idler.set_waist(wi);
    spdc.efficiencies(ranges, None)
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[wasm_bindgen]
pub fn get_heralding_results_pump_vs_signal_idler_waists(
  spd_config_raw : JsValue,
  integration_config :IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<JsValue, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let waists : Steps2D<Meter<f64>> = waist_ranges.into();

  let ret : Vec<spdcalc::Efficiencies> = waists.into_iter().map(move |(wp, wsi)| {
    spdc.pump.set_waist(wp);
    spdc.signal.set_waist(wsi);
    spdc.idler.set_waist(wsi);
    spdc.efficiencies(ranges, None)
  }).collect();

  Ok( serde_wasm_bindgen::to_value(&ret)? )
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CSI {
  pub coincidences: Vec<f64>,
  pub signal_singles: Vec<f64>,
  pub idler_singles: Vec<f64>,
}

impl CSI {
  pub fn new(coincidences: Vec<f64>, signal_singles: Vec<f64>, idler_singles: Vec<f64>) -> Self {
    Self { coincidences, signal_singles, idler_singles }
  }
}

#[wasm_bindgen]
pub fn get_jsi_csi( spd_config_raw : JsValue, integration_config :IntegrationConfig ) -> Result<JsValue, JsError> {
  let spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let spectrum = spdc.joint_spectrum(None);
  let coincidences = spectrum.jsi_range(ranges);
  let signal_singles = spectrum.jsi_singles_range(ranges);
  let idler_singles = spectrum.jsi_singles_idler_range(ranges);
  let max = coincidences.iter().chain(signal_singles.iter()).chain(idler_singles.iter()).max_by(|a, b| a.partial_cmp(b).unwrap()).unwrap();
  let coincidences = coincidences.iter().map(|i| *(*i / *max)).collect();
  let signal_singles = signal_singles.iter().map(|i| *(*i / *max)).collect();
  let idler_singles = idler_singles.iter().map(|i| *(*i / *max)).collect();
  let csi = CSI::new(coincidences, signal_singles, idler_singles);
  Ok( serde_wasm_bindgen::to_value(&csi)? )
}

#[wasm_bindgen]
pub fn get_schmidt_pump_bw_vs_crystal_length(
  spd_config_raw : JsValue,
  integration_config : IntegrationConfig,
  pump_bw_vs_crystal_len_meters: Grid2D,
) -> Result<Vec<f64>, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let steps : Steps2D<f64> = pump_bw_vs_crystal_len_meters.into();
  let results : Result<Vec<f64>, _> = steps.into_iter().map(|(len, pbw)| {
    spdc.crystal_setup.length = len * M;
    spdc.pump_bandwidth = pbw * M;
    spdc.joint_spectrum(None).schmidt_number(ranges)
  }).collect();

  Ok( results? )
}

#[wasm_bindgen]
pub fn get_schmidt_signal_vs_pump_waist(
  spd_config_raw : JsValue,
  integration_config : IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<Vec<f64>, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let waists : Steps2D<Meter<f64>> = waist_ranges.into();
  let results: Result<Vec<f64>, _> = waists.into_iter().map(|(wp, wsi)| {
    spdc.pump.set_waist(wp);
    spdc.signal.set_waist(wsi);
    spdc.idler.set_waist(wsi);
    spdc.joint_spectrum(None).schmidt_number(ranges)
  }).collect();

  Ok( results? )
}

#[wasm_bindgen]
pub fn get_schmidt_idler_vs_signal_waist(
  spd_config_raw : JsValue,
  integration_config : IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<Vec<f64>, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let waists : Steps2D<Meter<f64>> = waist_ranges.into();
  let results: Result<Vec<f64>, _> = waists.into_iter().map(|(ws, wi)| {
    spdc.signal.set_waist(ws);
    spdc.idler.set_waist(wi);
    spdc.joint_spectrum(None).schmidt_number(ranges)
  }).collect();

  Ok( results? )
}

#[wasm_bindgen]
pub fn get_hom_visibility_signal_vs_pump_waist(
  spd_config_raw : JsValue,
  integration_config : IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<Vec<f64>, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let waists : Steps2D<Meter<f64>> = waist_ranges.into();
  let results: Vec<f64> = waists.into_iter().map(move |(wp, wsi)| {
    spdc.pump.set_waist(wp);
    spdc.signal.set_waist(wsi);
    spdc.idler.set_waist(wsi);
    spdc.hom_visibility(ranges).1
  }).collect();

  Ok( results )
}

#[wasm_bindgen]
pub fn get_hom_visibility_idler_vs_signal_waist(
  spd_config_raw : JsValue,
  integration_config : IntegrationConfig,
  waist_ranges : WaistRanges
) -> Result<Vec<f64>, JsError> {
  let mut spdc = get_spdc( spd_config_raw )?;
  let ranges = spdcalc::jsa::WavelengthSpace::from(Steps2D::from(integration_config));
  let waists : Steps2D<Meter<f64>> = waist_ranges.into();
  let results: Vec<f64> = waists.into_iter().map(move |(ws, wi)|{
    spdc.idler.set_waist(wi);
    spdc.signal.set_waist(ws);
    spdc.hom_visibility(ranges).1
  }).collect();

  Ok( results )
}
