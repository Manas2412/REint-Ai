export const sampleActuals = [
  { targetTime: "2024-01-01T00:00:00.000Z", generation: 17000 },
  { targetTime: "2024-01-01T00:30:00.000Z", generation: 16800 },
  { targetTime: "2024-01-01T01:00:00.000Z", generation: 16600 },
  { targetTime: "2024-01-01T01:30:00.000Z", generation: 16500 },
  { targetTime: "2024-01-01T02:00:00.000Z", generation: 16750 },
  { targetTime: "2024-01-01T02:30:00.000Z", generation: 16900 },
];

export const sampleForecasts = [
  // for target 00:00
  {
    targetTime: "2024-01-01T00:00:00.000Z",
    publishTime: "2023-12-31T19:00:00.000Z",
    generation: 16800,
  },
  {
    targetTime: "2024-01-01T00:00:00.000Z",
    publishTime: "2023-12-31T22:00:00.000Z",
    generation: 17050,
  },
  // for target 00:30
  {
    targetTime: "2024-01-01T00:30:00.000Z",
    publishTime: "2023-12-31T21:30:00.000Z",
    generation: 16900,
  },
  // for target 01:00
  {
    targetTime: "2024-01-01T01:00:00.000Z",
    publishTime: "2024-01-01T00:00:00.000Z",
    generation: 16500,
  },
  // for target 02:00
  {
    targetTime: "2024-01-01T02:00:00.000Z",
    publishTime: "2024-01-01T00:30:00.000Z",
    generation: 16800,
  },
];
