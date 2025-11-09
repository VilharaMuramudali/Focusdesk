import newRequest from "./newRequest";

export default function logActivity(activity) {
  return newRequest.post("/activities", activity).catch(() => {});
} 