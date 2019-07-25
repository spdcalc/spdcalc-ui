use wasm_bindgen::prelude::*;
extern crate spdcalc;

use spdcalc::{
  dim::{
    f64prefixes::{MICRO, NANO},
    ucum::{DEG, RAD, M},
  },
  photon::Photon,
  crystal::*,
  spd::SPD,
  plotting::HistogramConfig,
};

#[derive(Deserialize)]
struct SPDConfig {
  pub crystal : String,
  pub pm_type : String,
  pub crystal_theta: f64,
  pub crystal_phi: f64,
  pub crystal_length: f64, // microns
  pub crystal_temperature: f64, // celsius

  pub pump_wavelength: f64, // nm
  pub pump_bandwidth: f64, // nm
  pub pump_waist: f64, // microns

  pub signal_wavelength: f64, // nm
  pub signal_theta: f64,
  pub signal_phi: f64,
  pub signal_bandwidth: f64, // nm
  pub signal_waist: f64, // microns
  pub signal_waist_position: f64, // microns

  pub idler_wavelength: f64, // nm
  pub idler_theta: f64,
  pub idler_phi: f64,
  pub idler_bandwidth: f64, // nm
  pub idler_waist: f64, // microns
  pub idler_waist_position: f64, // microns

  pub periodic_poling_enabled: bool,
  pub poling_period: f64, // microns
}

#[derive(Deserialize)]
struct IntegrationConfig {
  // nanometers
  pub ls_min : f64,
  pub ls_max : f64,
  pub li_min : f64,
  pub li_max : f64,

  // dimension of histogram
  pub size : usize,
}

fn parse_crystal( name : String ) -> Result<Crystal, JsValue> {
  match name.as_ref() {
    "BBO_1" => Ok(Crystal::BBO_1),
    "KTP" => Ok(Crystal::KTP),
    "BiBO_1" => Ok(Crystal::BiBO_1),
    "LiIO3_1" => Ok(Crystal::LiIO3_1),
    "AgGaS2_1" => Ok(Crystal::AgGaS2_1),
    _ => Err(format!("Crystal {} is not defined", name).into()),
  }
}

fn parse_pm_type( name : String ) -> Result<PMType, JsValue> {
  match name.as_ref() {
    "Type0_o_oo" => Ok(PMType::Type0_o_oo),
    "Type0_e_ee" => Ok(PMType::Type0_e_ee),
    "Type1_e_oo" => Ok(PMType::Type1_e_oo),
    "Type2_e_eo" => Ok(PMType::Type2_e_eo),
    "Type2_e_oe" => Ok(PMType::Type2_e_oe),
    _ => Err(format!("PMType {} is not defined", name).into()),
  }
}

fn parse_spd_setup( cfg : &JsValue ) -> Result<SPD, JsValue> {
  let spd_config : SPDConfig = cfg.into_serde().map_err(|e| "Problem parsing json")?;

  let crystal = parse_crystal( spd_config.crystal )?;
  let pm_type = parse_pm_type( spd_config.pm_type )?;

  let crystal_setup = spdcalc::crystal::CrystalSetup {
    crystal,
    pm_type,
    theta :       if spd_config.periodic_poling_enabled { 0. * DEG } else { spd_config.crystal_theta * RAD },
    phi :         spd_config.crystal_phi * RAD,
    length :      spd_config.crystal_length * MICRO * M,
    temperature : spdcalc::utils::from_celsius_to_kelvin(spd_config.crystal_temperature),
  };

  let pp = if spd_config.periodic_poling_enabled {
    Some(spdcalc::spd::PeriodicPoling{
      period: spd_config.poling_period.abs() * MICRO * M,
      sign: if spd_config.poling_period >= 0. { spdcalc::Sign::POSITIVE } else { spdcalc::Sign::NEGATIVE },
    })
  } else {
    None
  };

  let signal = Photon::signal(
    spd_config.signal_phi * RAD,
    spd_config.signal_theta * RAD,
    spd_config.signal_wavelength * NANO * M,
    spdcalc::WaistSize::new(spdcalc::na::Vector2::new(spd_config.signal_waist * MICRO, spd_config.signal_waist * MICRO))
  );
  let idler = Photon::idler(
    spd_config.idler_phi * RAD,
    spd_config.idler_theta * RAD,
    spd_config.idler_wavelength * NANO * M,
    spdcalc::WaistSize::new(spdcalc::na::Vector2::new(spd_config.idler_waist * MICRO, spd_config.idler_waist * MICRO))
  );
  let pump = Photon::pump(
    spd_config.pump_wavelength * NANO * M,
    spdcalc::WaistSize::new(spdcalc::na::Vector2::new(spd_config.pump_waist * MICRO, spd_config.pump_waist * MICRO))
  );

  let mut params = SPD {
    signal,
    idler,
    pump,
    crystal_setup,
    pp,
    fiber_coupling : false,
    pump_bandwidth : spd_config.pump_bandwidth * NANO * M,
    pump_spectrum_threshold: std::f64::EPSILON,
    ..SPD::default()
  };

  params.assign_optimum_idler();

  Ok(params)
}

fn parse_integration_config( cfg : &JsValue ) -> Result<HistogramConfig, JsValue> {
  let integration_config : IntegrationConfig = cfg.into_serde().map_err(|e| "Problem parsing json")?;

  Ok(HistogramConfig {
    x_range : (integration_config.ls_min * NANO, integration_config.ls_max * NANO),
    y_range : (integration_config.li_min * NANO, integration_config.li_max * NANO),

    x_count : integration_config.size,
    y_count : integration_config.size,
  })
}

#[wasm_bindgen]
pub fn get_jsi_data( spd_config_raw : &JsValue, integration_config_raw :&JsValue ) -> Result<Vec<f64>, JsValue> {
  let cfg = parse_integration_config( &integration_config_raw )?;
  let params = parse_spd_setup( &spd_config_raw )?;

  let data = spdcalc::plotting::plot_jsi(&params, &cfg);

  Ok(data)
}


#[wasm_bindgen]
pub fn calculate_crystal_theta( spd_config_raw : &JsValue ) -> Result<f64, JsValue> {
  let params = parse_spd_setup( &spd_config_raw )?;

  let radians = *(params.calc_optimum_crystal_theta() / RAD);
  Ok( radians )
}

#[wasm_bindgen]
pub fn calculate_periodic_poling( spd_config_raw : &JsValue ) -> Result<f64, JsValue> {
  let params = parse_spd_setup( &spd_config_raw )?;

  let pp = params.calc_periodic_poling();
  Ok( *(pp.sign * pp.period / M) )
}
