pub mod calculations;
pub mod models;

use wasm_bindgen::prelude::*;

pub use calculations::{
    calculate_additional_annual_savings, calculate_projection, calculate_simple_projection,
    calculate_yearly_projections, SimpleProjection,
};
pub use models::{
    AccountBalance, Assumptions, ChildInfo, ContributionConfig, HouseholdConfig,
    RetirementProjection, YearlyProjection,
};

#[wasm_bindgen]
pub struct RetirementCalculator;

impl Default for RetirementCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl RetirementCalculator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self
    }

    #[wasm_bindgen]
    pub fn calculate_projection(
        &self,
        household_config_js: JsValue,
        account_balance_js: JsValue,
        contributions_js: JsValue,
        children_js: JsValue,
        assumptions_js: JsValue,
        current_age: u32,
    ) -> Result<JsValue, JsValue> {
        let household_config: HouseholdConfig = serde_wasm_bindgen::from_value(household_config_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse household config: {}", e)))?;

        let account_balance: AccountBalance = serde_wasm_bindgen::from_value(account_balance_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse account balance: {}", e)))?;

        let contributions: ContributionConfig = serde_wasm_bindgen::from_value(contributions_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse contributions: {}", e)))?;

        let children: Vec<ChildInfo> = serde_wasm_bindgen::from_value(children_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse children: {}", e)))?;

        let assumptions: Assumptions = serde_wasm_bindgen::from_value(assumptions_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse assumptions: {}", e)))?;

        let projection = calculate_projection(
            &household_config,
            &account_balance,
            &contributions,
            &children,
            &assumptions,
            current_age,
        );

        serde_wasm_bindgen::to_value(&projection)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize projection: {}", e)))
    }

    #[wasm_bindgen]
    pub fn calculate_yearly_projections(
        &self,
        household_config_js: JsValue,
        account_balance_js: JsValue,
        contributions_js: JsValue,
        assumptions_js: JsValue,
        current_age: u32,
        current_year: u32,
    ) -> Result<JsValue, JsValue> {
        let household_config: HouseholdConfig = serde_wasm_bindgen::from_value(household_config_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse household config: {}", e)))?;

        let account_balance: AccountBalance = serde_wasm_bindgen::from_value(account_balance_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse account balance: {}", e)))?;

        let contributions: ContributionConfig = serde_wasm_bindgen::from_value(contributions_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse contributions: {}", e)))?;

        let assumptions: Assumptions = serde_wasm_bindgen::from_value(assumptions_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse assumptions: {}", e)))?;

        let projections = calculate_yearly_projections(
            &household_config,
            &account_balance,
            &contributions,
            &assumptions,
            current_age,
            current_year,
        );

        serde_wasm_bindgen::to_value(&projections)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize projections: {}", e)))
    }

    #[wasm_bindgen]
    pub fn calculate_simple_projection(
        &self,
        total_portfolio: f64,
        current_age: u32,
        retirement_age: u32,
        return_rate: f64,
        current_year: u32,
    ) -> Result<JsValue, JsValue> {
        let projections = calculate_simple_projection(
            total_portfolio,
            current_age,
            retirement_age,
            return_rate,
            current_year,
        );

        serde_wasm_bindgen::to_value(&projections)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize projections: {}", e)))
    }

    #[wasm_bindgen]
    pub fn calculate_additional_annual_savings(
        &self,
        current_portfolio: f64,
        target_portfolio: f64,
        years: u32,
        return_rate: f64,
        inflation_rate: f64,
        current_annual_contributions: f64,
    ) -> f64 {
        calculate_additional_annual_savings(
            current_portfolio,
            target_portfolio,
            years,
            return_rate,
            inflation_rate,
            current_annual_contributions,
        )
    }
}
