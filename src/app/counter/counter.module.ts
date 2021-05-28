import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { CounterComponent } from "./counter.component";
import { CounterEffect } from "./counter.effect";
import { counterFeature } from "./counter.slice";

@NgModule({
  declarations: [CounterComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: "", component: CounterComponent }]),
    StoreModule.forFeature(counterFeature),
    EffectsModule.forFeature([CounterEffect]),
  ],
})
export class CounterModule {}
