// 화면 전체에 깔리는 장식용 배경. 클릭/스크롤에 영향을 주지 않도록
// pointer-events-none, 콘텐츠 뒤로 가도록 -z-10을 사용한다.
// 라이트 모드 / 다크 모드는 globals.css의 prefers-color-scheme 미디어 쿼리와
// 동일한 기준(Tailwind의 dark: variant)으로 전환된다.

const CLOUDS = [
  { top: "6%", size: 150, duration: 58, delay: -10 },
  { top: "16%", size: 90, duration: 72, delay: -35 },
  { top: "28%", size: 170, duration: 64, delay: -18 },
  { top: "44%", size: 110, duration: 80, delay: -50 },
  { top: "60%", size: 140, duration: 60, delay: -5 },
  { top: "74%", size: 95, duration: 75, delay: -62 },
  { top: "86%", size: 160, duration: 68, delay: -28 },
];

const STARS = [
  { left: "4%", size: 3, duration: 14, delay: -2 },
  { left: "13%", size: 2, duration: 19, delay: -9 },
  { left: "22%", size: 4, duration: 12, delay: -4 },
  { left: "31%", size: 2, duration: 21, delay: -13 },
  { left: "40%", size: 3, duration: 16, delay: -1 },
  { left: "50%", size: 2, duration: 23, delay: -16 },
  { left: "59%", size: 4, duration: 13, delay: -7 },
  { left: "68%", size: 2, duration: 20, delay: -3 },
  { left: "77%", size: 3, duration: 17, delay: -11 },
  { left: "86%", size: 2, duration: 22, delay: -6 },
  { left: "94%", size: 3, duration: 15, delay: -19 },
];

function Cloud() {
  return (
    <div className="relative h-full w-full opacity-70">
      <div className="absolute inset-0 rounded-full bg-white blur-sm" />
      <div className="absolute left-[18%] top-[-45%] h-[85%] w-[55%] rounded-full bg-white blur-sm" />
      <div className="absolute left-[48%] top-[-28%] h-[70%] w-[45%] rounded-full bg-white blur-sm" />
    </div>
  );
}

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 라이트 모드: 흐르는 구름 */}
      <div className="absolute inset-0 dark:hidden">
        {CLOUDS.map((cloud, i) => (
          <div
            key={i}
            className="absolute left-0"
            style={{
              top: cloud.top,
              width: cloud.size,
              height: cloud.size * 0.4,
              animation: `drift-right ${cloud.duration}s linear infinite`,
              animationDelay: `${cloud.delay}s`,
            }}
          >
            <Cloud />
          </div>
        ))}
      </div>

      {/* 다크 모드: 떨어지는 별 */}
      <div className="absolute inset-0 hidden dark:block">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="absolute top-[-5%] rounded-full bg-white"
            style={{
              left: star.left,
              width: star.size,
              height: star.size,
              boxShadow: "0 0 4px 1px rgba(255,255,255,0.8)",
              animation: `fall-down ${star.duration}s linear infinite`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
