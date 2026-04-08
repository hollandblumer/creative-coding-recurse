"use client";

import { useEffect, useMemo, useState } from "react";

const FONT_CLASSES = ["mono", "rainbow", "brico"];
const ALL_COLORS = ["var(--blue)", "var(--orange)", "var(--yellow)", "var(--green)", "var(--white)", "var(--black)", "var(--brown)"];
const TITLE_HIGHLIGHT_COLORS = ["var(--blue)", "var(--orange)", "var(--green)", "var(--white)", "var(--brown)"];
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
const BACKGROUND_DECADES = [
  { text: "1930", top: "10%", left: "8%", rotation: -8, size: "clamp(28px, 4vw, 58px)" },
  { text: "1940", top: "18%", right: "9%", rotation: 6, size: "clamp(24px, 3.6vw, 48px)" },
  { text: "1950", top: "34%", left: "14%", rotation: -4, size: "clamp(30px, 4.4vw, 62px)" },
  { text: "1960", top: "42%", right: "12%", rotation: 9, size: "clamp(26px, 3.8vw, 52px)" },
  { text: "1970", top: "58%", left: "10%", rotation: -7, size: "clamp(22px, 3.2vw, 44px)" },
  { text: "1980", top: "68%", right: "16%", rotation: 5, size: "clamp(32px, 4.8vw, 66px)" },
  { text: "1990", top: "78%", left: "24%", rotation: -5, size: "clamp(24px, 3.4vw, 46px)" },
  { text: "2000", top: "84%", right: "24%", rotation: 7, size: "clamp(26px, 3.7vw, 50px)" },
];

function pickDifferentFont(previous) {
  const options = FONT_CLASSES.filter((font) => font !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

function pickStableFont(text, index, previous, pool = FONT_CLASSES) {
  const options = pool.filter((font) => font !== previous);
  const seedSource = `${text}-${index}`;
  let hash = 0;

  for (let i = 0; i < seedSource.length; i += 1) {
    hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
  }

  return options[hash % options.length];
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
      const fontClass = pickStableFont(`${value}%`, index, previous);
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
    const fontClass = pickStableFont(text, index, previous);
    previous = fontClass;

    return (
      <span key={`${text}-${char}-${index}`} className={`char ${fontClass} pop`}>
        {char === " " ? "\u00A0" : char}
      </span>
    );
  });
}

function BackgroundDecades() {
  return (
    <div className="background-decades" aria-hidden="true">
      {BACKGROUND_DECADES.map((item) => {
        let previous = null;

        return (
          <span
            key={`${item.text}-${item.top}-${item.left ?? item.right}`}
            className="background-decade"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              transform: `rotate(${item.rotation}deg)`,
              fontSize: item.size,
            }}
          >
            {item.text.split("").map((char, index) => {
              const fontClass = pickStableFont(item.text, index, previous);
              previous = fontClass;

              return (
                <span key={`${item.text}-${char}-${index}`} className={`background-decade-char ${fontClass}`}>
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

function CursorShower() {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    let timeoutId = null;
    let lastSpawn = 0;

    const handleMove = (event) => {
      const now = performance.now();
      if (now - lastSpawn < 28) {
        return;
      }

      lastSpawn = now;

      const nextBurst = Array.from({ length: 6 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 6 + Math.random() * 0.45;
        const distance = 10 + Math.random() * 24;
        const decade = DECADES[Math.floor(Math.random() * DECADES.length)].label;
        let previous = null;
        const chars = decade.split("").map((char, charIndex) => {
          const fontClass = pickStableFont(decade, charIndex, previous);
          previous = fontClass;

          return {
            char,
            fontClass,
            key: `${decade}-${index}-${charIndex}`,
          };
        });

        return {
          id: `${now}-${index}-${Math.random()}`,
          chars,
          x: event.clientX + Math.cos(angle) * distance,
          y: event.clientY + Math.sin(angle) * distance,
          rotation: -20 + Math.random() * 40,
          scale: 0.8 + Math.random() * 0.45,
          color: ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)],
        };
      });

      setBursts((current) => [...current.slice(-42), ...nextBurst]);

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setBursts((current) => current.slice(-26));
      }, 620);
    };

    window.addEventListener("pointermove", handleMove);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (bursts.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBursts((current) => current.slice(Math.max(0, current.length - 20)));
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [bursts]);

  return (
    <div className="cursor-shower" aria-hidden="true">
      {bursts.map((burst) => (
        <span
          key={burst.id}
          className="cursor-spark"
          style={{
            left: burst.x,
            top: burst.y,
            color: burst.color,
            transform: `translate(-50%, -50%) rotate(${burst.rotation}deg) scale(${burst.scale})`,
          }}
        >
          {(burst.chars ?? [{ char: burst.text ?? "", fontClass: "mono", key: `${burst.id}-fallback` }]).map((item) => (
            <span key={item.key} className={`cursor-spark-char ${item.fontClass}`}>
              {item.char}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
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
        const randomColor = TITLE_HIGHLIGHT_COLORS[index % TITLE_HIGHLIGHT_COLORS.length];
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorValue, setGeneratorValue] = useState(DECADES[0].label);
  const [showGeneratorResult, setShowGeneratorResult] = useState(false);

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

  return (
    <main className="page-shell">
      {loading ? <Loader onDone={() => setLoading(false)} /> : null}
      <BackgroundDecades />
      <CursorShower />

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

        <div className="center-content" id="mainContainer">
          <div className="title-group">
            <div className="title-main" id="shuffleTitle">
              <TitleWord text="creative" interval={800} />
              <TitleWord text="coding" interval={1200} />
              <TitleWord text="meetup" interval={1000} />
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
            <span className="start-button-inner">
              <span className="start-button-text mono">start</span>
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
