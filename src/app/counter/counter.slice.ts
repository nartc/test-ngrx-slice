import {
  createSlice,
  PayloadAction,
  typedNoopReducer,
} from "../utils/create-slice";

interface CounterState {
  count: number;
  incrementCount: number;
  decrementCount: number;
}

const {
  selectors: CounterSelectors,
  actions: CounterActions,
  ...counterFeature
} = createSlice({
  name: "counter",
  initialState: {
    count: 0,
    incrementCount: 0,
    decrementCount: 0,
  } as CounterState,
  reducers: {
    increment: (state) => ({
      ...state,
      count: state.count + 1,
      incrementCount: state.incrementCount + 1,
    }),
    decrement: (state) => ({
      ...state,
      count: state.count - 1,
      decrementCount: state.decrementCount + 1,
    }),
    doubleAsync: {
      success: (state) => ({ ...state, count: state.count * 2 }),
    },
    multiplyAsync: {
      success: (state, action: PayloadAction<{ count: number }>) => ({
        ...state,
        count: action.payload.count,
      }),
      trigger: typedNoopReducer<CounterState, { multiplier: number }>(),
    },
  },
});

export { CounterSelectors, CounterActions, counterFeature };
