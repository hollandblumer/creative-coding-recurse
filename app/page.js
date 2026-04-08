"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FONT_CLASSES = ["mono", "rainbow", "brico"];
const ALL_COLORS = ["var(--blue)", "var(--orange)", "var(--yellow)", "var(--green)", "var(--white)", "var(--black)", "var(--brown)"];
const DECADES = [
  { label: "1930", years: ["1930"] },
  { label: "1940", years: ["1940"] },
  { label: "1950", years: ["1950"] },
  { label: "1960", years: ["1960"] },
  { label: "1970", years: ["1970"] },
  { label: "1980", years: ["1980"] },
  { label: "1990", years: ["1990"] },
  { label: "2000", years: ["2000"] },
];

function pickDifferentFont(previous) {
  const options = FONT_CLASSES.filter((font) => font !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

function MixedCharacters({ text }) {
  let previous = null;

  return text.split("").map((char, index) => {
    const fontClass = pickDifferentFont(previous);
    previous = fontClass;

    return (
      <span key={`${char}-${index}`} className={`char ${fontClass}`}>
        {char === " " ? "\u00A0" : char}
      </span>
    );
  });
}

function Loader({ onDone }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let timeoutId;

    if (value < 100) {
      timeoutId = window.setTimeout(() => setValue((current) => Math.min(100, current + (current < 60 ? 4 : 7))), 45);
    } else {
      timeoutId = window.setTimeout(() => onDone(), 450);
    }

    return () => window.clearTimeout(timeoutId);
  }, [onDone, value]);

  const loaderText = useMemo(() => {
    let previous = null;

    return `${value}%`.split("").map((char, index) => {
      const fontClass = pickDifferentFont(previous);
      previous = fontClass;

      return { char, fontClass, key: `${value}-${char}-${index}` };
    });
  }, [value]);

  return (
    <div className="loader-screen" aria-live="polite">
      <div className="percent">
        {loaderText.map((item) => (
          <span key={item.key} className={`char ${item.fontClass} pop`}>
            {item.char}
          </span>
        ))}
      </div>
    </div>
  );
}

function GeneratorText({ text }) {
  let previous = null;

  return text.split("").map((char, index) => {
    const fontClass = pickDifferentFont(previous);
    previous = fontClass;

    return (
      <span key={`${text}-${char}-${index}`} className={`char ${fontClass} pop`}>
        {char === " " ? "\u00A0" : char}
      </span>
    );
  });
}

function MatterBackground({ activeDecade, safeAreaRef }) {
  const sceneRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let teardown = () => {};

    async function start() {
      const matter = await import("matter-js");
      const { Bodies, Body, Composite, Engine, Events, Runner, Vector } = matter;
      const scene = sceneRef.current;

      if (!scene || disposed) {
        return;
      }

      const engine = Engine.create();
      engine.gravity.y = 1.8;
      const world = engine.world;
      let viewportWidth = window.innerWidth;
      let viewportHeight = window.innerHeight;
      let mouse = { x: -1000, y: -1000 };
      const spawnedElements = [];

      const makeWalls = () => {
        const ground = Bodies.rectangle(viewportWidth / 2, viewportHeight + 25, viewportWidth * 4, 50, { isStatic: true });
        const wallLeft = Bodies.rectangle(-50, viewportHeight / 2, 100, viewportHeight * 2, { isStatic: true });
        const wallRight = Bodies.rectangle(viewportWidth + 50, viewportHeight / 2, 100, viewportHeight * 2, { isStatic: true });
        Composite.add(world, [ground, wallLeft, wallRight]);
      };

      makeWalls();

      const runner = Runner.create();
      Runner.run(runner, engine);

      const randomYearPool = () => {
        const allDecades = DECADES.flatMap((decade) => decade.years);
        return [...allDecades, ...allDecades, ...activeDecade.years];
      };

      const spawnYear = () => {
        if (!scene) {
          return;
        }

        const yearPool = randomYearPool();
        const yearText = yearPool[Math.floor(Math.random() * yearPool.length)];
        const fontSize = Math.floor(Math.random() * 28) + 56;
        const x = Math.random() * viewportWidth;
        const element = document.createElement("div");

        element.className = "physics-year";
        element.style.fontSize = `${fontSize}px`;
        element.style.color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];

        let previous = null;
        yearText.split("").forEach((char, index) => {
          const fontClass = pickDifferentFont(previous);
          previous = fontClass;

          const span = document.createElement("span");
          span.className = `char ${fontClass}`;
          span.textContent = char;
          span.dataset.index = String(index);
          element.appendChild(span);
        });

        scene.appendChild(element);
        const body = Bodies.rectangle(x, -100, fontSize * 2.9, fontSize * 1.15, {
          restitution: 0.2,
          friction: 0.1,
          frictionAir: 0.01,
        });

        body.element = element;
        Composite.add(world, body);
        spawnedElements.push(element);
      };

      const handlePointerMove = (event) => {
        mouse = { x: event.clientX, y: event.clientY };
      };

      Events.on(engine, "afterUpdate", () => {
        const safeRect = safeAreaRef.current?.getBoundingClientRect();
        const center = safeRect
          ? { x: safeRect.left + safeRect.width / 2, y: safeRect.top + safeRect.height / 2 }
          : { x: viewportWidth / 2, y: viewportHeight / 2 };

        Composite.allBodies(world).forEach((body) => {
          if (body.isStatic || !body.element) {
            return;
          }

          const pointsToAvoid = [
            { pos: center, radius: 250, strength: 0.005 },
            { pos: mouse, radius: 200, strength: 0.015 },
          ];

          pointsToAvoid.forEach((point) => {
            const offset = Vector.sub(body.position, point.pos);
            const distance = Vector.magnitude(offset);

            if (distance > 0 && distance < point.radius) {
              const direction = Vector.normalise(offset);
              const force = Vector.mult(direction, point.strength);
              Body.applyForce(body, body.position, force);
            }
          });

          const { x, y } = body.position;
          const width = body.bounds.max.x - body.bounds.min.x;
          const height = body.bounds.max.y - body.bounds.min.y;
          body.element.style.transform = `translate(${x - width / 2}px, ${y - height / 2}px) rotate(${body.angle}rad)`;
        });
      });

      const spawnInterval = window.setInterval(() => {
        if (Composite.allBodies(world).length < 18) {
          spawnYear();
        }
      }, 760);

      window.addEventListener("pointermove", handlePointerMove);

      teardown = () => {
        window.clearInterval(spawnInterval);
        window.removeEventListener("pointermove", handlePointerMove);
        Runner.stop(runner);
        Composite.clear(world, false);
        Engine.clear(engine);
        spawnedElements.forEach((element) => element.remove());
      };
    }

    start();

    return () => {
      disposed = true;
      teardown();
    };
  }, [activeDecade, safeAreaRef]);

  return <div ref={sceneRef} className="matter-scene" aria-hidden="true" />;
}

function TitleWord({ text, interval }) {
  const [highlighted, setHighlighted] = useState([]);

  useEffect(() => {
    const shuffle = () => {
      const indices = Array.from({ length: text.length }, (_, index) => index)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      setHighlighted(indices);
    };

    shuffle();
    const timerId = window.setInterval(shuffle, interval);

    return () => window.clearInterval(timerId);
  }, [interval, text]);

  return (
    <div className="word" aria-label={text}>
      {text.split("").map((char, index) => {
        const active = highlighted.includes(index);
        const colorChoices = ALL_COLORS.filter((color) => color !== "var(--black)");
        const randomColor = colorChoices[index % colorChoices.length];
        const rotation = ((index % 5) - 2) * 2;

        return (
          <span
            key={`${text}-${char}-${index}`}
            className={`t-char${active ? " hw-style" : ""}`}
            style={
              active
                ? {
                    color: randomColor,
                    transform: `rotate(${rotation}deg) scale(1.15)`,
                  }
                : undefined
            }
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [activeDecade, setActiveDecade] = useState(DECADES[0]);
  const mainContainerRef = useRef(null);
  const [clock, setClock] = useState(() => new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorValue, setGeneratorValue] = useState(DECADES[0].label);
  const [showGeneratorResult, setShowGeneratorResult] = useState(false);

  useEffect(() => {
    const timerId = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    let frameCount = 0;
    const totalFrames = 18;

    const intervalId = window.setInterval(() => {
      frameCount += 1;
      const next = DECADES[Math.floor(Math.random() * DECADES.length)];
      setGeneratorValue(next.label);

      if (frameCount >= totalFrames) {
        window.clearInterval(intervalId);
        setActiveDecade(next);
        setGeneratorValue(next.label);
        setShowGeneratorResult(true);
        window.setTimeout(() => setIsGenerating(false), 380);
      }
    }, 85);

    return () => window.clearInterval(intervalId);
  }, [isGenerating]);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(clock);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  })
    .format(clock)
    .toLowerCase();

  return (
    <main className="page-shell">
      {loading ? <Loader onDone={() => setLoading(false)} /> : null}
      <MatterBackground activeDecade={activeDecade} safeAreaRef={mainContainerRef} />

      <div className={`experience${loading ? " is-hidden" : ""}`}>
        {isGenerating || showGeneratorResult ? (
          <div className="generator-screen" aria-live="polite">
            <button
              type="button"
              className="generator-close"
              aria-label="Close decade result"
              onClick={() => {
                if (!isGenerating) {
                  setShowGeneratorResult(false);
                }
              }}
            >
              <span className="mono">x</span>
            </button>
            <div className="generator-label">you are decade</div>
            <div className="generator-value">
              <GeneratorText text={generatorValue} />
            </div>
          </div>
        ) : null}

        <div className="center-content" id="mainContainer" ref={mainContainerRef}>
          <div className="title-group">
            <div className="meta-row">
              <div className="mixed-text">
                <MixedCharacters text={formattedDate} />
              </div>
              <div className="mixed-text">
                <MixedCharacters text={formattedTime} />
              </div>
            </div>

            <div className="title-main" id="shuffleTitle">
              <TitleWord text="creative" interval={800} />
              <TitleWord text="coding" interval={1200} />
            </div>
          </div>

          <button
            type="button"
            className="start-button"
            aria-label="Generate your decade"
            onClick={() => {
              if (!isGenerating) {
                setShowGeneratorResult(true);
                setGeneratorValue(activeDecade.label);
                setIsGenerating(true);
              }
            }}
          >
            find out
          </button>
        </div>
      </div>
    </main>
  );
}
