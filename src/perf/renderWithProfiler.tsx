import {
  Profiler,
  type ProfilerOnRenderCallback,
  type ReactElement,
} from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

export type ProfilerSample = {
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
};

export type RenderWithProfilerOptions = {
  id: string;
  element: ReactElement;
  update?: ReactElement;
};

export function renderWithProfiler({
  id,
  element,
  update,
}: RenderWithProfilerOptions): ProfilerSample[] {
  if (typeof document === "undefined") {
    throw new Error("renderWithProfiler requires a browser environment.");
  }

  const samples: ProfilerSample[] = [];

  const onRender: ProfilerOnRenderCallback = (
    renderId,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  ) => {
    samples.push({
      id: renderId,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    });
  };

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  flushSync(() => {
    root.render(
      <Profiler id={id} onRender={onRender}>
        {element}
      </Profiler>,
    );
  });

  if (update) {
    flushSync(() => {
      root.render(
        <Profiler id={id} onRender={onRender}>
          {update}
        </Profiler>,
      );
    });
  }

  flushSync(() => {
    root.unmount();
  });

  container.remove();

  return samples;
}
