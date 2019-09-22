// service.{version}.action
export function reform(
  actionName: string,
  nodeID: string,
  version?: string
): string {
  const arr = actionName.split('.');

  if (arr.length === 1) {
    if (version) {
      console.error('actionName error', actionName, version);
    }
    return `${nodeID}.${arr[0]}`;
  }
  if (arr.length === 2) {
    if (version) {
      return `${arr[0]}.${version}.${arr[1]}`;
    }
    return `${arr[0]}.${arr[1]}`;
  }
  if (arr.length === 3) {
    if (version) {
      console.error('actionName error', actionName, version);
    }
    return actionName;
  }
  throw new Error('actionName error ' + actionName);
}
