/* tslint:disable */
/* eslint-disable */

export class RetirementCalculator {
    free(): void;
    [Symbol.dispose](): void;
    calculate_additional_annual_savings(current_portfolio: number, target_portfolio: number, years: number, return_rate: number, inflation_rate: number, current_annual_contributions: number): number;
    calculate_projection(household_config_js: any, account_balance_js: any, contributions_js: any, children_js: any, assumptions_js: any, current_age: number): any;
    calculate_simple_projection(total_portfolio: number, current_age: number, retirement_age: number, return_rate: number, current_year: number): any;
    calculate_yearly_projections(household_config_js: any, account_balance_js: any, contributions_js: any, assumptions_js: any, current_age: number, current_year: number): any;
    constructor();
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_retirementcalculator_free: (a: number, b: number) => void;
    readonly retirementcalculator_calculate_additional_annual_savings: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
    readonly retirementcalculator_calculate_projection: (a: number, b: any, c: any, d: any, e: any, f: any, g: number) => [number, number, number];
    readonly retirementcalculator_calculate_simple_projection: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly retirementcalculator_calculate_yearly_projections: (a: number, b: any, c: any, d: any, e: any, f: number, g: number) => [number, number, number];
    readonly retirementcalculator_new: () => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
