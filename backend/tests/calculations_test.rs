use retirement_core::calculations::{
    calculate_additional_annual_savings, calculate_projection, calculate_simple_projection,
    calculate_yearly_projections,
};
use retirement_core::models::{AccountBalance, Assumptions, ContributionConfig, HouseholdConfig};

#[test]
fn test_additional_annual_savings_no_gap() {
    let current: f64 = 1000000.0;
    let target: f64 = 900000.0;
    let years = 27;
    let result = calculate_additional_annual_savings(current, target, years, 7.0, 2.5, 0.0);
    assert_eq!(result, 0.0);
}

#[test]
fn test_additional_annual_savings_zero_years() {
    let current: f64 = 100000.0;
    let target: f64 = 1000000.0;
    let years = 0;
    let result = calculate_additional_annual_savings(current, target, years, 7.0, 2.5, 0.0);
    assert_eq!(result, 0.0);
}

#[test]
fn test_additional_annual_savings_simple_case() {
    let current: f64 = 10000.0;
    let target: f64 = 2362500.0;
    let years = 27;
    let return_rate: f64 = 7.0;
    let inflation: f64 = 2.5;
    let current_contributions: f64 = 0.0;

    let additional = calculate_additional_annual_savings(
        current,
        target,
        years,
        return_rate,
        inflation,
        current_contributions,
    );

    // Verify that adding this amount brings us close to the target
    let monthly_rate = return_rate / 100.0 / 12.0;
    let monthly_inflation = inflation / 100.0 / 12.0;
    let months = years * 12;
    let inflation_factor = (1.0_f64 + monthly_inflation).powi(months as i32);
    let monthly_contribution = (current_contributions + additional) / 12.0;

    let mut balance = current;
    for _ in 0..months {
        balance = balance * (1.0 + monthly_rate) + monthly_contribution;
    }

    let final_value = balance / inflation_factor;

    // Should be within $100 of target (tolerance in binary search)
    let diff = final_value - target;
    assert!(
        diff.abs() < 100.0,
        "Final value {} is more than $100 from target {}",
        final_value,
        target
    );
}

#[test]
fn test_additional_annual_savings_with_existing_contributions() {
    let current: f64 = 10000.0;
    let target: f64 = 2362500.0;
    let years = 27;
    let return_rate: f64 = 7.0;
    let inflation: f64 = 2.5;
    let current_contributions: f64 = 10000.0;

    let additional = calculate_additional_annual_savings(
        current,
        target,
        years,
        return_rate,
        inflation,
        current_contributions,
    );

    // Additional should be less than when starting from 0
    let additional_zero =
        calculate_additional_annual_savings(current, target, years, return_rate, inflation, 0.0);

    assert!(
        additional < additional_zero,
        "Additional savings with existing contributions {} should be less than without {}",
        additional,
        additional_zero
    );
}

#[test]
fn test_additional_annual_savings_exact_match() {
    let current: f64 = 10000.0;
    let target: f64 = 2362500.0;
    let years = 27;
    let return_rate: f64 = 7.0;
    let inflation: f64 = 2.5;

    // Calculate the exact additional needed
    let additional =
        calculate_additional_annual_savings(current, target, years, return_rate, inflation, 0.0);

    // Now simulate with that exact amount
    let monthly_rate = return_rate / 100.0 / 12.0;
    let monthly_inflation = inflation / 100.0 / 12.0;
    let months = years * 12;
    let inflation_factor = (1.0_f64 + monthly_inflation).powi(months as i32);
    let monthly_contribution = additional / 12.0;

    let mut balance = current;
    for _ in 0..months {
        balance = balance * (1.0 + monthly_rate) + monthly_contribution;
    }

    let final_value = balance / inflation_factor;

    // The gap should be less than tolerance ($100)
    let gap = final_value - target;
    assert!(
        gap.abs() < 100.0,
        "Gap {} is greater than tolerance $100",
        gap
    );
}

#[test]
fn test_additional_annual_savings_user_scenario() {
    let current: f64 = 10000.0;
    let target: f64 = 2362500.0;
    let years = 27;
    let return_rate: f64 = 7.0;
    let inflation: f64 = 2.5;
    let current_contributions: f64 = 10000.0;

    // Calculate additional needed
    let additional = calculate_additional_annual_savings(
        current,
        target,
        years,
        return_rate,
        inflation,
        current_contributions,
    );

    // User adds this amount (57,308)
    let total_annual = current_contributions + additional;

    // Simulate to verify
    let monthly_rate = return_rate / 100.0 / 12.0;
    let monthly_inflation = inflation / 100.0 / 12.0;
    let months = years * 12;
    let inflation_factor = (1.0_f64 + monthly_inflation).powi(months as i32);
    let monthly_contribution = total_annual / 12.0;

    let mut balance = current;
    for _ in 0..months {
        balance = balance * (1.0 + monthly_rate) + monthly_contribution;
    }

    let final_value = balance / inflation_factor;

    // Should be within $100 of target (very small gap expected)
    let gap = final_value - target;
    assert!(
        gap.abs() < 100.0,
        "Gap {} is greater than tolerance $100. Additional: {}, Total: {}",
        gap,
        additional,
        total_annual
    );
}

fn make_household(retirement_age: u32) -> HouseholdConfig {
    HouseholdConfig {
        retirement_age,
        expected_annual_income: 0.0,
    }
}

fn make_balances(rrsp: f64, tfsa: f64) -> AccountBalance {
    AccountBalance {
        rrsp,
        tfsa,
        resp: 0.0,
        non_registered: 0.0,
    }
}

fn make_contributions(rrsp: f64, tfsa: f64) -> ContributionConfig {
    ContributionConfig {
        rrsp_annual: rrsp,
        tfsa_annual: tfsa,
        resp_annual: 0.0,
        non_registered_annual: 0.0,
    }
}

fn make_assumptions(return_rate: f64, inflation_rate: f64) -> Assumptions {
    Assumptions {
        return_rate,
        inflation_rate,
    }
}

#[test]
fn test_calculate_projection_basic() {
    let result = calculate_projection(
        &make_household(65),
        &make_balances(50000.0, 30000.0),
        &make_contributions(5000.0, 6000.0),
        &[],
        &make_assumptions(7.0, 2.5),
        35,
    );
    assert_eq!(result.current_age, 35);
    assert_eq!(result.retirement_age, 65);
    assert_eq!(result.years_to_retirement, 30);
    assert!(result.net_worth_at_retirement > 80000.0);
    assert!(result.annual_withdrawal > 0.0);
}

#[test]
fn test_calculate_projection_zero_years() {
    let result = calculate_projection(
        &make_household(65),
        &make_balances(100000.0, 50000.0),
        &make_contributions(0.0, 0.0),
        &[],
        &make_assumptions(7.0, 2.5),
        65,
    );
    assert_eq!(result.years_to_retirement, 0);
    assert_eq!(result.net_worth_at_retirement, 150000.0);
    assert_eq!(result.annual_withdrawal, 0.0);
}

#[test]
fn test_calculate_projection_zero_balances() {
    let result = calculate_projection(
        &make_household(65),
        &make_balances(0.0, 0.0),
        &make_contributions(1000.0, 1000.0),
        &[],
        &make_assumptions(7.0, 2.5),
        35,
    );
    assert!(result.net_worth_at_retirement > 0.0);
}

#[test]
fn test_calculate_projection_zero_return_rate() {
    let result = calculate_projection(
        &make_household(65),
        &make_balances(100000.0, 0.0),
        &make_contributions(12000.0, 0.0),
        &[],
        &make_assumptions(0.0, 2.5),
        55,
    );
    let expected = 100000.0 + 12000.0 * 10.0;
    assert!((result.net_worth_at_retirement - expected).abs() < 1.0);
}

#[test]
fn test_calculate_yearly_projections_basic() {
    let projections = calculate_yearly_projections(
        &make_household(65),
        &make_balances(50000.0, 30000.0),
        &make_contributions(5000.0, 6000.0),
        &make_assumptions(7.0, 2.5),
        35,
        2026,
    );
    assert_eq!(projections.len(), 31);
    assert_eq!(projections[0].year, 2026);
    assert_eq!(projections[0].age, 35);
    assert_eq!(projections[30].year, 2056);
    assert_eq!(projections[30].age, 65);
    assert!(projections[30].total_net_worth > projections[0].total_net_worth);
}

#[test]
fn test_calculate_yearly_projections_current_year_param() {
    let projections = calculate_yearly_projections(
        &make_household(67),
        &make_balances(100000.0, 0.0),
        &make_contributions(0.0, 0.0),
        &make_assumptions(5.0, 2.0),
        40,
        2030,
    );
    assert_eq!(projections[0].year, 2030);
    assert_eq!(projections[0].age, 40);
    assert_eq!(projections[27].year, 2057);
    assert_eq!(projections[27].age, 67);
}

#[test]
fn test_calculate_yearly_projections_zero_balances() {
    let projections = calculate_yearly_projections(
        &make_household(65),
        &make_balances(0.0, 0.0),
        &make_contributions(0.0, 0.0),
        &make_assumptions(7.0, 2.5),
        35,
        2026,
    );
    assert_eq!(projections.len(), 31);
    for p in &projections {
        assert!((p.total_net_worth - 0.0).abs() < 0.01);
    }
}

#[test]
fn test_calculate_yearly_projections_zero_return_rate() {
    let projections = calculate_yearly_projections(
        &make_household(65),
        &make_balances(10000.0, 0.0),
        &make_contributions(12000.0, 0.0),
        &make_assumptions(0.0, 2.5),
        55,
        2026,
    );
    assert_eq!(projections.len(), 11);
    assert_eq!(projections[0].year, 2026);
    let first = projections[0].rrsp;
    let last = projections[10].rrsp;
    assert!((last - (first + 12000.0 * 10.0)).abs() < 1.0);
}

#[test]
fn test_calculate_yearly_projections_max_age() {
    let projections = calculate_yearly_projections(
        &make_household(100),
        &make_balances(1000.0, 0.0),
        &make_contributions(0.0, 0.0),
        &make_assumptions(7.0, 2.5),
        1,
        2026,
    );
    assert_eq!(projections.len(), 100);
    assert_eq!(projections[0].age, 1);
    assert_eq!(projections[99].age, 100);
}

#[test]
fn test_calculate_simple_projection_basic() {
    let projections = calculate_simple_projection(100000.0, 35, 65, 7.0, 2026);
    assert_eq!(projections.len(), 31);
    assert_eq!(projections[0].year, 2026);
    assert_eq!(projections[0].age, 35);
    assert_eq!(projections[0].portfolio_value, 100000.0);
    assert!(projections[30].portfolio_value > 100000.0);
}

#[test]
fn test_calculate_simple_projection_zero_years() {
    let projections = calculate_simple_projection(100000.0, 65, 65, 7.0, 2026);
    assert!(projections.is_empty());
}

#[test]
fn test_calculate_simple_projection_zero_balance() {
    let projections = calculate_simple_projection(0.0, 35, 65, 7.0, 2026);
    assert_eq!(projections.len(), 31);
    for p in &projections {
        assert!((p.portfolio_value - 0.0).abs() < 0.01);
    }
}

#[test]
fn test_calculate_simple_projection_zero_return() {
    let projections = calculate_simple_projection(50000.0, 40, 65, 0.0, 2026);
    assert_eq!(projections.len(), 26);
    for p in &projections {
        assert!((p.portfolio_value - 50000.0).abs() < 0.01);
    }
}
