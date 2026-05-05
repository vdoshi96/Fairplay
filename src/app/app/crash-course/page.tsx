import { redirect } from "next/navigation";

import { getAppSessionView } from "@/components/app-shell/session-view";
import { CrashCoursePageClient } from "@/components/crash-course/crash-course-page-client";

export default async function AppCrashCoursePage() {
  const sessionView = await getAppSessionView();

  if (!sessionView) {
    redirect("/login");
  }

  if (!sessionView.selectedPersona) {
    redirect("/choose-persona");
  }

  return <CrashCoursePageClient selectedPersona={sessionView.selectedPersona} />;
}
