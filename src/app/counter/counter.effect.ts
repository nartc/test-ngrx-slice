import { Injectable } from "@angular/core";
import { Actions, concatLatestFrom, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { timer } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { CounterActions, CounterSelectors } from "./counter.slice";

@Injectable()
export class CounterEffect {
  constructor(
    private readonly actions$: Actions,
    private readonly store: Store
  ) {}

  readonly doubleEffect = createEffect(() =>
    this.actions$.pipe(
      ofType(CounterActions.doubleAsync.trigger),
      switchMap(() =>
        timer(1000).pipe(map(() => CounterActions.doubleAsync.success()))
      )
    )
  );

  readonly multiplyEffect = createEffect(() =>
    this.actions$.pipe(
      ofType(CounterActions.multiplyAsync.trigger),
      concatLatestFrom(() => this.store.select(CounterSelectors.selectCount)),
      switchMap(([{ payload }, count]) => {
        return timer(1000).pipe(
          map(() =>
            CounterActions.multiplyAsync.success({
              payload: { count: payload.multiplier * count },
            })
          )
        );
      })
    )
  );
}
