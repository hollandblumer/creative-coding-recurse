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
  { text: "1930", left: "9%", settle: "72%", rotation: -5, size: "clamp(44px, 6.7vw, 108px)", duration: "10.8s", delay: "0s" },
  { text: "1940", left: "26%", settle: "82%", rotation: 4, size: "clamp(36px, 5.4vw, 88px)", duration: "11.6s", delay: "1.8s" },
  { text: "1950", left: "43%", settle: "70%", rotation: -4, size: "clamp(50px, 7.5vw, 118px)", duration: "10.1s", delay: "3.4s" },
  { text: "1960", left: "60%", settle: "84%", rotation: 5, size: "clamp(38px, 5.8vw, 94px)", duration: "11.2s", delay: "5.1s" },
  { text: "1970", left: "77%", settle: "74%", rotation: -6, size: "clamp(46px, 7vw, 114px)", duration: "10.4s", delay: "6.7s" },
  { text: "1980", left: "91%", settle: "86%", rotation: 4, size: "clamp(34px, 5.2vw, 84px)", duration: "11.4s", delay: "8.3s" },
  { text: "1990", left: "18%", settle: "90%", rotation: 3, size: "clamp(32px, 4.9vw, 80px)", duration: "12.1s", delay: "9.8s" },
  { text: "2000", left: "69%", settle: "92%", rotation: -3, size: "clamp(36px, 5.6vw, 92px)", duration: "11.8s", delay: "11.2s" },
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
            key={`${item.text}-${item.left}`}
            className="background-decade"
            style={{
              left: item.left,
              "--settle": item.settle,
              transform: `rotate(${item.rotation}deg)`,
              fontSize: item.size,
              animationDuration: item.duration,
              animationDelay: item.delay,
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

      <div className={`experience${loading ? " is-hidden" : ""}`}>
        {isGenerating || showGeneratorResult ? (
          <div className="generator-screen" aria-live="polite">
            <div className="generator-label">you are decade</div>
            <div className="generator-value">
              <GeneratorText text={generatorValue} />
            </div>
          </div>
        ) : null}

        <div className="center-content" id="mainContainer">
          <button
            type="button"
            className="title-button"
            aria-label="Generate your decade"
            onClick={() => {
              if (!isGenerating) {
                setShowGeneratorResult(true);
                setGeneratorValue(activeDecade.label);
                setIsGenerating(true);
              }
            }}
          >
            <div className="title-group">
              <div className="title-main" id="shuffleTitle">
                <TitleWord text="click" interval={800} />
                <TitleWord text="here" interval={1200} />
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
