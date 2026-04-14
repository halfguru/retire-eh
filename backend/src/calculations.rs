use crate::models::{
    AccountBalance, Assumptions, ChildInfo, ContributionConfig, HouseholdConfig,
    RetirementProjection, YearlyProjection,
};

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimpleProjection {
    pub year: u32,
    pub age: u32,
    pub portfolio_value: f64,
}

pub fn calculate_projection(
    household_config: &HouseholdConfig,
    account_balance: &AccountBalance,
    contributions: &ContributionConfig,
    _children: &[ChildInfo],
    assumptions: &Assumptions,
    current_age: u32,
) -> RetirementProjection {
    let years_to_retirement = household_config.retirement_age.saturating_sub(current_age);

    if years_to_retirement == 0 {
        return RetirementProjection {
            current_age,
            retirement_age: household_config.retirement_age,
            years_to_retirement: 0,
            net_worth_at_retirement: account_balance.rrsp
                + account_balance.tfsa
                + account_balance.non_registered,
            annual_withdrawal: 0.0,
            pension_equivalent: 0.0,
        };
    }

    let monthly_return_rate = assumptions.return_rate / 100.0 / 12.0;
    let months_to_retirement = years_to_retirement * 12;

    let monthly_contributions = (contributions.rrsp_annual
        + contributions.tfsa_annual
        + contributions.non_registered_annual)
        / 12.0;

    let initial_balance =
        account_balance.rrsp + account_balance.tfsa + account_balance.non_registered;

    let net_worth_at_retirement = calculate_future_value(
        initial_balance,
        monthly_contributions,
        monthly_return_rate,
        months_to_retirement,
    );

    let annual_withdrawal = calculate_safe_withdrawal(net_worth_at_retirement);
    let pension_equivalent = annual_withdrawal;

    RetirementProjection {
        current_age,
        retirement_age: household_config.retirement_age,
        years_to_retirement,
        net_worth_at_retirement,
        annual_withdrawal,
        pension_equivalent,
    }
}

pub fn calculate_yearly_projections(
    household_config: &HouseholdConfig,
    account_balance: &AccountBalance,
    contributions: &ContributionConfig,
    assumptions: &Assumptions,
    current_age: u32,
    current_year: u32,
) -> Vec<YearlyProjection> {
    let years_to_retirement = household_config.retirement_age.saturating_sub(current_age);
    let monthly_return_rate = assumptions.return_rate / 100.0 / 12.0;

    let mut rrsp = account_balance.rrsp;
    let mut tfsa = account_balance.tfsa;
    let mut resp = account_balance.resp;
    let mut non_registered = account_balance.non_registered;

    let mut projections = Vec::new();

    for year in 0..=years_to_retirement {
        projections.push(YearlyProjection {
            year: current_year + year,
            age: current_age + year,
            rrsp,
            tfsa,
            resp,
            non_registered,
            total_net_worth: rrsp + tfsa + resp + non_registered,
        });

        if year < years_to_retirement {
            for _ in 0..12 {
                rrsp = rrsp * (1.0 + monthly_return_rate) + (contributions.rrsp_annual / 12.0);
                tfsa = tfsa * (1.0 + monthly_return_rate) + (contributions.tfsa_annual / 12.0);
                resp = resp * (1.0 + monthly_return_rate) + (contributions.resp_annual / 12.0);
                non_registered = non_registered * (1.0 + monthly_return_rate)
                    + (contributions.non_registered_annual / 12.0);
            }
        }
    }

    projections
}

fn calculate_future_value(
    present_value: f64,
    monthly_contribution: f64,
    monthly_return_rate: f64,
    months: u32,
) -> f64 {
    if monthly_return_rate.abs() < f64::EPSILON {
        return present_value + monthly_contribution * months as f64;
    }
    let fv_of_pv = present_value * (1.0 + monthly_return_rate).powi(months as i32);
    let fv_of_contributions = monthly_contribution
        * ((1.0 + monthly_return_rate).powi(months as i32) - 1.0)
        / monthly_return_rate;
    fv_of_pv + fv_of_contributions
}

fn calculate_safe_withdrawal(net_worth: f64) -> f64 {
    net_worth * 0.04
}

pub fn calculate_simple_projection(
    total_portfolio: f64,
    current_age: u32,
    retirement_age: u32,
    return_rate: f64,
    current_year: u32,
) -> Vec<SimpleProjection> {
    let years_to_retirement = retirement_age.saturating_sub(current_age);

    if years_to_retirement == 0 {
        return vec![];
    }

    let mut projections = Vec::new();

    for year in 0..=years_to_retirement {
        let age = current_age + year;
        let portfolio_value = total_portfolio * (1.0 + return_rate / 100.0).powi(year as i32);
        projections.push(SimpleProjection {
            year: current_year + year,
            age,
            portfolio_value,
        });
    }

    projections
}

pub fn calculate_additional_annual_savings(
    current_portfolio: f64,
    target_portfolio: f64,
    years: u32,
    return_rate: f64,
    inflation_rate: f64,
    current_annual_contributions: f64,
) -> f64 {
    if years == 0 || current_portfolio >= target_portfolio {
        return 0.0;
    }

    let monthly_return_rate = return_rate / 100.0 / 12.0;
    let monthly_inflation_rate = inflation_rate / 100.0 / 12.0;
    let months = years * 12;
    let inflation_factor = (1.0 + monthly_inflation_rate).powi(months as i32);

    let simulate_projection = |annual_contribution: f64| -> f64 {
        let mut balance = current_portfolio;
        let monthly_contribution = annual_contribution / 12.0;
        for _ in 0..months {
            balance = balance * (1.0 + monthly_return_rate) + monthly_contribution;
        }
        balance / inflation_factor
    };

    let tolerance = 100.0;
    let mut low = 0.0;
    let mut high = f64::max(current_annual_contributions * 2.0, 1000000.0);

    for _ in 0..100 {
        let mid = (low + high) / 2.0;
        let result = simulate_projection(mid);

        if (result - target_portfolio).abs() < tolerance {
            return f64::max(0.0, mid - current_annual_contributions).round();
        }

        if result < target_portfolio {
            low = mid;
        } else {
            high = mid;
        }
    }

    let final_result = (low + high) / 2.0;
    f64::max(0.0, final_result - current_annual_contributions).round()
}
