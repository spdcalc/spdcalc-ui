use wasm_bindgen::prelude::*;
extern crate spdcalc;

use spdcalc::{
  dim::{
    f64prefixes::{MICRO, NANO},
    ucum::{DEG, M},
  },
  photon::Photon,
  crystal::*,
  spd::SPD,
  plotting::HistogramConfig,
};

#[derive(Deserialize)]
struct SPDConfig {
  pub crystal : String,
  pub signal_wavelength : f64,
  pub signal_bandwidth : f64,
}

#[derive(Deserialize)]
struct JSIConfig {
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

fn parse_spd_setup( cfg : &JsValue ) -> Result<SPD, JsValue> {
  let spd_config : SPDConfig = cfg.into_serde().map_err(|e| "Problem parsing json")?;

  let crystal = parse_crystal( spd_config.crystal )?;

  let crystal_setup = spdcalc::crystal::CrystalSetup {
    crystal :     crystal,
    pm_type :     PMType::Type1_e_oo,
    theta :       90. * DEG,
    phi :         0. * DEG,
    length :      2_000.0 * MICRO * M,
    temperature : spdcalc::utils::from_celsius_to_kelvin(20.0),
  };

  let waist = spdcalc::WaistSize::new(spdcalc::na::Vector2::new(100.0 * MICRO, 100.0 * MICRO));
  let signal = Photon::signal(0. * DEG, 0. * DEG, spd_config.signal_wavelength * NANO * M, waist);
  let idler = Photon::idler(180. * DEG, 0. * DEG, 1550. * NANO * M, waist);
  let pump = Photon::pump(775. * NANO * M, waist);

  let mut params = SPD {
    signal,
    idler,
    pump,
    crystal_setup,
    pp : None,
    fiber_coupling : false,
    pump_bandwidth : spd_config.signal_bandwidth * 1e-9 * spdcalc::dim::ucum::M,
    pump_spectrum_threshold: std::f64::EPSILON,
    ..SPD::default()
  };

  params.assign_optimum_theta();

  Ok(params)
}

fn parse_jsi_config( cfg : &JsValue ) -> Result<HistogramConfig, JsValue> {
  let jsi_config : JSIConfig = cfg.into_serde().map_err(|e| "Problem parsing json")?;

  Ok(HistogramConfig {
    x_range : (jsi_config.ls_min * NANO, jsi_config.ls_max * NANO),
    y_range : (jsi_config.li_min * NANO, jsi_config.li_max * NANO),

    x_count : jsi_config.size,
    y_count : jsi_config.size,
  })
}

#[wasm_bindgen]
pub fn get_jsi_data( spd_config_raw : &JsValue, jsi_config_raw :&JsValue ) -> Result<Vec<f64>, JsValue> {
  let cfg = parse_jsi_config( &jsi_config_raw )?;
  let params = parse_spd_setup( &spd_config_raw )?;

  let data = spdcalc::plotting::plot_jsi(&params, &cfg);

  Ok(data)
}
