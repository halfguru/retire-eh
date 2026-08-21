use crate::models::{
    AccountBalance, Assumptions, ChildInfo, ContributionConfig, HouseholdConfig,
    RetirementProjection, YearlyProjection,
};
use js_sys;

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

// --- Simulation engines (Monte Carlo accumulation + retirement drawdown) ---
//
// These mirror the monthly-compounding model used by calculate_yearly_projections
// but sample returns randomly to show the distribution of outcomes, not just the
// deterministic path. Returns are nominal; results are deflated to today's
// dollars using the supplied inflation rate, matching the frontend's real view.

fn gaussian() -> f64 {
    let u = loop {
        let u = js_sys::Math::random();
        if u != 0.0 {
            break u;
        }
    };
    let v = loop {
        let v = js_sys::Math::random();
        if v != 0.0 {
            break v;
        }
    };
    (-2.0 * u.ln()).sqrt() * (2.0 * std::f64::consts::PI * v).cos()
}

fn percentile(sorted: &[f64], p: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let idx = (sorted.len() as f64 - 1.0) * p;
    let lo = idx.floor() as usize;
    let hi = idx.ceil() as usize;
    if lo == hi {
        return sorted[lo];
    }
    sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo as f64)
}

fn default_volatility() -> f64 {
    0.13
}

fn default_sims() -> u32 {
    500
}

fn default_true() -> bool {
    true
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonteCarloParams {
    pub initial_balance: f64,
    pub monthly_contribution: f64,
    pub months: u32,
    pub expected_return_pct: f64,
    pub inflation_pct: f64,
    pub start_age: u32,
    #[serde(default = "default_volatility")]
    pub annual_volatility: f64,
    #[serde(default = "default_sims")]
    pub sims: u32,
    #[serde(default = "default_true")]
    pub show_real_values: bool,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonteCarloYear {
    pub age: u32,
    pub p10: f64,
    pub p25: f64,
    pub p50: f64,
    pub p75: f64,
    pub p90: f64,
}

// Runs `sims` accumulation simulations with randomly sampled monthly returns and
// returns per-age percentile bands (10/25/50/75/90) in today's dollars.
pub fn run_monte_carlo(params: &MonteCarloParams) -> Vec<MonteCarloYear> {
    let monthly_mean = params.expected_return_pct / 100.0 / 12.0;
    let monthly_sd = params.annual_volatility / 12.0_f64.sqrt();
    let years = (params.months / 12) as usize;
    let sims = params.sims.max(1) as usize;

    let mut per_year: Vec<Vec<f64>> = (0..=years).map(|_| Vec::with_capacity(sims)).collect();

    for _ in 0..sims {
        let mut balance = params.initial_balance;
        per_year[0].push(balance);
        for m in 1..=params.months {
            let r = monthly_mean + monthly_sd * gaussian();
            balance = balance * (1.0 + r) + params.monthly_contribution;
            if balance < 0.0 {
                balance = 0.0;
            }
            if m % 12 == 0 {
                per_year[(m / 12) as usize].push(balance);
            }
        }
    }

    (0..=years)
        .map(|y| {
            let mut vals = std::mem::take(&mut per_year[y]);
            vals.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
            let inflation_factor = (1.0 + params.inflation_pct / 100.0).powi(y as i32);
            let deflate = |v: f64| if params.show_real_values { v / inflation_factor } else { v };
            MonteCarloYear {
                age: params.start_age + y as u32,
                p10: deflate(percentile(&vals, 0.1)),
                p25: deflate(percentile(&vals, 0.25)),
                p50: deflate(percentile(&vals, 0.5)),
                p75: deflate(percentile(&vals, 0.75)),
                p90: deflate(percentile(&vals, 0.9)),
            }
        })
        .collect()
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetirementPathParams {
    pub start_balance: f64,
    pub expected_return_pct: f64,
    pub inflation_pct: f64,
    pub withdrawal_rate_pct: f64,
    pub start_age: u32,
    pub end_age: u32,
    #[serde(default = "default_volatility")]
    pub annual_volatility: f64,
    #[serde(default = "default_sims")]
    pub sims: u32,
    #[serde(default = "default_true")]
    pub show_real_values: bool,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetirementPathYear {
    pub age: u32,
    pub p10: f64,
    pub p25: f64,
    pub p50: f64,
    pub p75: f64,
    pub p90: f64,
}

// Simulates the retirement (decumulation) phase with randomly sampled returns and
// a constant real withdrawal (the 4% rule). Returns per-age percentile bands in
// today's dollars so the chart shows both the median and the downside drawdown.
pub fn simulate_retirement_paths(params: &RetirementPathParams) -> Vec<RetirementPathYear> {
    let monthly_mean = if params.show_real_values {
        let real_annual = (1.0 + params.expected_return_pct / 100.0) / (1.0 + params.inflation_pct / 100.0) - 1.0;
        real_annual / 12.0
    } else {
        params.expected_return_pct / 100.0 / 12.0
    };
    let monthly_sd = params.annual_volatility / 12.0_f64.sqrt();
    let monthly_withdrawal = (params.start_balance * (params.withdrawal_rate_pct / 100.0)) / 12.0;
    let years = (params.end_age - params.start_age) as usize;
    let sims = params.sims.max(1) as usize;

    let mut per_year: Vec<Vec<f64>> = (0..=years).map(|_| Vec::with_capacity(sims)).collect();

    for _ in 0..sims {
        let mut balance = params.start_balance;
        per_year[0].push(balance);
        for age in (params.start_age + 1)..=params.end_age {
            for _ in 0..12 {
                let r = monthly_mean + monthly_sd * gaussian();
                balance = balance * (1.0 + r) - monthly_withdrawal;
                if balance < 0.0 {
                    balance = 0.0;
                }
            }
            per_year[(age - params.start_age) as usize].push(balance);
        }
    }

    (0..=years)
        .map(|y| {
            let mut vals = std::mem::take(&mut per_year[y]);
            vals.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
            let inflation_factor = (1.0 + params.inflation_pct / 100.0).powi(y as i32);
            let deflate = |v: f64| v / inflation_factor;
            RetirementPathYear {
                age: params.start_age + y as u32,
                p10: deflate(percentile(&vals, 0.1)),
                p25: deflate(percentile(&vals, 0.25)),
                p50: deflate(percentile(&vals, 0.5)),
                p75: deflate(percentile(&vals, 0.75)),
                p90: deflate(percentile(&vals, 0.9)),
            }
        })
        .collect()
}
