import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { CounterActions, CounterSelectors } from "./counter.slice";

@Component({
  selector: "app-counter",
  template: `
    <button (click)="decrement()">-</button>
    {{ count$ | async }}
    <button (click)="increment()">+</button>

    <p>You have pressed increment: {{ incrementCount$ | async }} times</p>
    <p>You have pressed decrement: {{ decrementCount$ | async }} times</p>

    <button (click)="doubleAsync()">double</button>
    <br />
    <button (click)="multiplyAsync()">multiply</button>
    <p>Last multiplier: {{ randomMultiplier }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  randomMultiplier = 1;

  count$ = this.store.select(CounterSelectors.selectCount);
  incrementCount$ = this.store.select(CounterSelectors.selectIncrementCount);
  decrementCount$ = this.store.select(CounterSelectors.selectDecrementCount);

  constructor(private readonly store: Store) {}

  doubleAsync() {
    this.store.dispatch(CounterActions.doubleAsync.trigger());
  }

  multiplyAsync() {
    this.randomMultiplier = Math.floor(Math.random() * 9 + 2);
    this.store.dispatch(
      CounterActions.multiplyAsync.trigger({
        payload: { multiplier: this.randomMultiplier },
      })
    );
  }

  increment() {
    this.store.dispatch(CounterActions.increment());
  }

  decrement() {
    this.store.dispatch(CounterActions.decrement());
  }
}
