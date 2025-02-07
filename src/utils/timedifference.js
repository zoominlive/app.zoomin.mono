export function timeDifference(time1, time2) {
  const [h1, m1, s1] = time1.split(':').map(Number);
  const [h2, m2, s2] = time2.split(':').map(Number);

  const date1 = new Date(1970, 0, 1, h1, m1, s1);
  const date2 = new Date(1970, 0, 1, h2, m2, s2);

  let diffInSeconds = Math.abs((date1 - date2) / 1000); // Difference in seconds

  // Convert seconds to HH:MM:SS format
  const hours = Math.floor(diffInSeconds / 3600);
  diffInSeconds %= 3600;
  const minutes = Math.floor(diffInSeconds / 60);
  const seconds = diffInSeconds % 60;

  return { hours, minutes, seconds };
}
