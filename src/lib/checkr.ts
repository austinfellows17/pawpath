const CHECKR_API_BASE =
  process.env.CHECKR_API_BASE?.trim() || "https://api.checkr.com/v1";

export function isCheckrConfigured() {
  return Boolean(process.env.CHECKR_API_KEY?.trim());
}

export function getCheckrPackageSlug() {
  return process.env.CHECKR_PACKAGE_SLUG?.trim() || "driver_pro";
}

function getAuthHeader() {
  const apiKey = process.env.CHECKR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CHECKR_API_KEY is not configured");
  }
  const token = Buffer.from(`${apiKey}:`).toString("base64");
  return `Basic ${token}`;
}

async function checkrRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${CHECKR_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Checkr API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

type CheckrCandidate = {
  id: string;
  email: string;
};

type CheckrInvitation = {
  id: string;
  status: string;
  invitation_url?: string;
  report_id?: string | null;
};

type CheckrReport = {
  id: string;
  status: string;
  result: string | null;
};

export async function createCheckrCandidate({
  email,
  firstName,
  lastName,
  zipCode,
  city,
  state = "CA",
}: {
  email: string;
  firstName: string;
  lastName: string;
  zipCode: string;
  city?: string | null;
  state?: string;
}) {
  return checkrRequest<CheckrCandidate>("/candidates", {
    method: "POST",
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
      zipcode: zipCode,
      city: city ?? undefined,
      work_locations: [{ country: "US", state }],
    }),
  });
}

export async function createCheckrInvitation({
  candidateId,
  packageSlug,
  state = "CA",
}: {
  candidateId: string;
  packageSlug: string;
  state?: string;
}) {
  return checkrRequest<CheckrInvitation>("/invitations", {
    method: "POST",
    body: JSON.stringify({
      candidate_id: candidateId,
      package: packageSlug,
      work_locations: [{ country: "US", state }],
    }),
  });
}

export async function getCheckrReport(reportId: string) {
  return checkrRequest<CheckrReport>(`/reports/${reportId}`);
}

export function mapCheckrResultToStatus(result: string | null): {
  status: "CLEAR" | "CONSIDER" | "SUSPENDED" | "FAILED";
  isBackgroundChecked: boolean;
} {
  switch (result) {
    case "clear":
      return { status: "CLEAR", isBackgroundChecked: true };
    case "consider":
      return { status: "CONSIDER", isBackgroundChecked: false };
    case "suspended":
      return { status: "SUSPENDED", isBackgroundChecked: false };
    default:
      return { status: "FAILED", isBackgroundChecked: false };
  }
}
