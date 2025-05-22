export function formatLanguageStatus(status: string) {
  if(status === 'living') {
    return "Living";
  } else if(status === 'dead') {
    return "Dead";
  } else if(status === 'proto') {
    return "Proto-Language";
  } else {
    return `Unknown (${status})`;
  }
}
