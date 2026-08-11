/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import autocannon from 'autocannon';
import { track } from 'autocannon';
const instance = autocannon(
  {
    url: 'http://localhost:3000/api/v1/reports/ventas/buscar',
    method: 'POST',
    connections: 10, // Default is 10
    duration: 10, // Duration in seconds
    headers: {
      'content-type': 'application/json',
      authorization: 'TEST TOKEN',
    },
    body: JSON.stringify({
      globalSearch: '',
      filterModel: {
        // "cliente": {
        //    "filterType": "text",
        //      "type": "contains",
        //      "filter": "Celtics Jardines"
        //  }
      },
      dateRange: {
        startDate: '2026-02-01',
        endDate: '2026-03-01',
      },
    }),
  },
  (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
  },
);

// Optional: Track progress in the terminal
track(instance, { renderProgressBar: true });
