import {
  Action,
  ActionCreator,
  ActionReducer,
  createAction,
  createFeatureSelector,
  createReducer,
  createSelector,
  MemoizedSelector,
  on,
  props,
} from "@ngrx/store";
import { OnReducer, ReducerTypes } from "@ngrx/store/src/reducer_creator";

export type Primitive = string | number | bigint | boolean | null | undefined;

export type RequiredKeys<T> = {
  [K in keyof T]: {} extends { [P in K]: T[K] } ? never : K;
}[keyof T];

export type NonOptional<T> = Pick<T, RequiredKeys<T>>;

export type SliceActionNameGetter = (
  featureName: string,
  actionName: string
) => string;

export interface PayloadAction<Payload = unknown> extends Action {
  payload: Payload;
}

export type CaseReducer<FeatureState = unknown> = (
  state: FeatureState,
  action: PayloadAction
) => FeatureState;

export interface AsyncCaseReducer<FeatureState = unknown> {
  success: CaseReducer<FeatureState>;
  failure?: CaseReducer<FeatureState>;
  trigger?: CaseReducer<FeatureState>;
}

export interface SliceCaseReducers<FeatureState> {
  [K: string]: CaseReducer<FeatureState> | AsyncCaseReducer<FeatureState>;
}

export interface SliceOptions<
  FeatureName extends string,
  FeatureState,
  FeatureCaseReducers extends SliceCaseReducers<FeatureState>
> {
  name: FeatureName;
  initialState: FeatureState;
  reducers: FeatureCaseReducers;
  extraReducers?: Array<ReducerTypes<FeatureState, any>>;
  sliceActionNameGetter?: SliceActionNameGetter;
}

export type FeatureSelector<
  AppState extends Record<string, unknown>,
  FeatureName extends keyof AppState & string,
  FeatureState extends AppState[FeatureName]
> = {
  [K in FeatureName as `select${Capitalize<K>}State`]: MemoizedSelector<
    AppState,
    FeatureState
  >;
};

export type NestedSelectors<
  AppState extends Record<string, unknown>,
  FeatureState
> = FeatureState extends Primitive | unknown[] | Date
  ? Record<string, never>
  : {
      [K in keyof NonOptional<FeatureState> &
        string as `select${Capitalize<K>}`]: MemoizedSelector<
        AppState,
        FeatureState[K]
      >;
    };

export type SliceActions<
  FeatureState,
  CaseReducers extends SliceCaseReducers<FeatureState>
> = {
  [Type in keyof CaseReducers]: CaseReducers[Type] extends AsyncCaseReducer<FeatureState>
    ? ActionCreatorForAsyncCaseReducer<FeatureState, CaseReducers[Type]>
    : ActionCreatorForCaseReducer<FeatureState, CaseReducers[Type]>;
};

export interface ActionCreatorForAsyncCaseReducer<
  FeatureState,
  AsyncReducer extends AsyncCaseReducer<FeatureState>
> {
  success: ActionCreatorForCaseReducer<FeatureState, AsyncReducer["success"]>;
  failure: ActionCreatorForCaseReducer<FeatureState, AsyncReducer["failure"]>;
  trigger: ActionCreatorForCaseReducer<FeatureState, AsyncReducer["trigger"]>;
}

export type ActionCreatorForCaseReducer<FeatureState, Reducer> =
  Reducer extends (
    state: FeatureState,
    action: infer ReducerAction
  ) => FeatureState
    ? ReducerAction extends { payload: infer ActionPayload }
      ? ((payload: {
          payload: ActionPayload;
        }) => PayloadAction<ActionPayload>) & {
          type: string;
        }
      : (() => PayloadAction<never>) & {
          type: string;
        }
    : (() => PayloadAction<never>) & {
        type: string;
      };

export interface Slice<
  AppState extends Record<string, unknown>,
  FeatureName extends keyof AppState & string,
  FeatureState extends AppState[FeatureName],
  FeatureCaseReducers extends SliceCaseReducers<FeatureState>
> {
  name: FeatureName;
  reducer: ActionReducer<FeatureState>;
  actions: SliceActions<FeatureState, FeatureCaseReducers>;
  selectors: FeatureSelector<AppState, FeatureName, FeatureState> &
    NestedSelectors<AppState, FeatureState>;
}

export function capitalize<T extends string>(text: T): Capitalize<T> {
  return (text.charAt(0).toUpperCase() + text.substr(1)) as Capitalize<T>;
}

export function isDictionary(arg: unknown): arg is Record<string, unknown> {
  return (
    typeof arg === "object" &&
    arg !== null &&
    !Array.isArray(arg) &&
    !(arg instanceof Date)
  );
}

function defaultSliceActionNameGetter(
  featureName: string,
  actionName: string
): string {
  return `[${featureName}] ${actionName}`;
}

export function noopReducer<FeatureState>(): CaseReducer<FeatureState> {
  return (state) => state;
}

export function typedNoopReducer<FeatureState, ActionProps = any>(): (
  state: FeatureState,
  action: PayloadAction<ActionProps>
) => FeatureState {
  return (state, _) => state;
}

export function createSlice<
  AppState extends Record<string, unknown>,
  FeatureName extends keyof AppState & string = keyof AppState & string,
  FeatureState extends AppState[FeatureName] = AppState[FeatureName],
  FeatureCaseReducers extends SliceCaseReducers<FeatureState> = SliceCaseReducers<FeatureState>
>({
  name,
  initialState,
  reducers,
  extraReducers,
  sliceActionNameGetter = defaultSliceActionNameGetter,
}: SliceOptions<FeatureName, FeatureState, FeatureCaseReducers>): Slice<
  AppState,
  FeatureName,
  FeatureState,
  FeatureCaseReducers
> {
  const featureSelector = createFeatureSelector<AppState, FeatureState>(name);
  const nestedSelectors = createNestedSelectors<AppState, FeatureState>(
    initialState,
    featureSelector
  );
  const actions = createActions<FeatureState, FeatureName, FeatureCaseReducers>(
    name,
    sliceActionNameGetter,
    reducers
  );
  const reducer = createReducers(
    initialState,
    sliceActionNameGetter,
    actions,
    reducers,
    extraReducers
  );

  return {
    name,
    reducer,
    actions,
    selectors: {
      [`select${capitalize(name)}State`]: featureSelector,
      ...nestedSelectors,
    } as Slice<
      AppState,
      FeatureName,
      FeatureState,
      FeatureCaseReducers
    >["selectors"],
  };
}

function createReducers<
  AppState extends Record<string, unknown>,
  FeatureName extends keyof AppState & string = keyof AppState & string,
  FeatureState extends AppState[FeatureName] = AppState[FeatureName],
  FeatureCaseReducers extends SliceCaseReducers<FeatureState> = SliceCaseReducers<FeatureState>
>(
  initialState: FeatureState,
  sliceActionNameGetter: SliceActionNameGetter,
  actions: SliceActions<FeatureState, FeatureCaseReducers>,
  reducers: FeatureCaseReducers,
  extraReducers?: SliceOptions<
    FeatureName,
    FeatureState,
    FeatureCaseReducers
  >["extraReducers"]
) {
  const reducerArgs = [] as Array<ReturnType<typeof on>>;
  const extra: Array<ReturnType<typeof on>> = extraReducers || [];

  Object.entries(reducers).forEach(([reducerKey, reducer]) => {
    const typeOfReducer = typeof reducer;

    if (typeOfReducer === "function") {
      reducerArgs.push(
        on(
          actions[reducerKey] as unknown as ActionCreator,
          reducer as OnReducer<FeatureState, any>
        )
      );
    } else if (typeOfReducer === "object") {
      ["success", "failure", "trigger"].forEach((asyncKey) => {
        const asyncReducer = reducer[asyncKey];
        reducerArgs.push(on(actions[reducerKey][asyncKey], asyncReducer));
      });
    }
  });

  return createReducer(initialState, ...(reducerArgs.concat(extra) as any));
}

function createActions<
  FeatureState,
  FeatureName extends string = string,
  FeatureCaseReducers extends SliceCaseReducers<FeatureState> = SliceCaseReducers<FeatureState>
>(
  featureName: FeatureName,
  sliceActionNameGetter: SliceActionNameGetter,
  reducers: FeatureCaseReducers
): SliceActions<FeatureState, FeatureCaseReducers> {
  const actions: Record<string, unknown> = {};

  Object.entries(reducers).forEach(
    ([reducerKey, reducerValue]: [string, any]) => {
      const typeOfReducer = typeof reducerValue;
      const sliceActionName = sliceActionNameGetter(featureName, reducerKey);
      if (typeOfReducer === "function") {
        actions[reducerKey] = createAction(sliceActionName, props<any>());
      } else if (typeOfReducer === "object") {
        actions[reducerKey] = {};
        ["success", "failure", "trigger"].forEach((asyncKey) => {
          const capitalizedAsyncKey = capitalize(asyncKey);
          actions[reducerKey][asyncKey] = createAction(
            `${sliceActionName} ${capitalizedAsyncKey}`,
            props<any>()
          );
        });
      }
    }
  );

  return actions as unknown as SliceActions<FeatureState, FeatureCaseReducers>;
}

function createNestedSelectors<
  AppState extends Record<string, unknown>,
  FeatureState
>(
  initialState: FeatureState,
  featureSelector: MemoizedSelector<AppState, FeatureState>
): NestedSelectors<AppState, FeatureState> {
  const nestedKeys = (
    isDictionary(initialState) ? Object.keys(initialState) : []
  ) as Array<keyof FeatureState & string>;

  return nestedKeys.reduce(
    (nestedSelectors, nestedKey) => ({
      ...nestedSelectors,
      [`select${capitalize(nestedKey)}`]: createSelector(
        featureSelector,
        (parentState) => parentState[nestedKey]
      ),
    }),
    {} as NestedSelectors<AppState, FeatureState>
  );
}
