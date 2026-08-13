import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 같은 IP는 60초에 최대 10번까지만 요청할 수 있도록 제한합니다.
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
});
