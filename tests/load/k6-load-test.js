import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 users
    { duration: '1m', target: 100 },  // Steady state at 100 concurrent users
    { duration: '30s', target: 200 },  // Stress spike to 200 users
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<400'], // 95% of requests must complete within 200ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

export default function () {
  group('Public Pages (No Auth)', () => {
    const resHome = http.get(`${BASE_URL}/`);
    check(resHome, {
      'homepage status is 200': (r) => r.status === 200,
    });

    const resFaqs = http.get(`${BASE_URL}/faqs`);
    check(resFaqs, {
      'faqs status is 200': (r) => r.status === 200,
    });

    const resTestimonials = http.get(`${BASE_URL}/testimonials`);
    check(resTestimonials, {
      'testimonials status is 200': (r) => r.status === 200,
    });
  });

  group('Health & Public API', () => {
    const resHealth = http.get(`${API_URL}/health`);
    check(resHealth, {
      'api health check 200': (r) => r.status === 200,
    });

    const resCmsFaqs = http.get(`${API_URL}/cms/faqs`);
    check(resCmsFaqs, {
      'cms faqs status 200': (r) => r.status === 200,
    });

    const resCmsTestimonials = http.get(`${API_URL}/cms/testimonials`);
    check(resCmsTestimonials, {
      'cms testimonials status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}

