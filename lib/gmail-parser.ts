type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailPayload = {
  headers?: GmailHeader[];
  parts?: GmailPayload[];
  body?: {
    data?: string;
  };
  mimeType?: string;
};

export function getHeader(headers: GmailHeader[] | undefined, name: string) {
  return (
    headers?.find(
      (header) => header.name?.toLowerCase() === name.toLowerCase()
    )?.value || ""
  );
}

export function parseEmailAddress(value: string) {
  const match = value.match(/^(.*)<(.+)>$/);

  if (!match) {
    return {
      name: "",
      email: value.trim(),
    };
  }

  return {
    name: match[1].replace(/"/g, "").trim(),
    email: match[2].trim(),
  };
}

export function decodeBase64Url(data?: string) {
  if (!data) return "";

  try {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

export function extractBody(payload?: GmailPayload): {
  text: string;
  html: string;
} {
  if (!payload) {
    return { text: "", html: "" };
  }

  if (payload.mimeType === "text/plain") {
    return {
      text: decodeBase64Url(payload.body?.data),
      html: "",
    };
  }

  if (payload.mimeType === "text/html") {
    return {
      text: "",
      html: decodeBase64Url(payload.body?.data),
    };
  }

  if (payload.parts?.length) {
    return payload.parts.reduce(
      (acc, part) => {
        const body = extractBody(part);

        return {
          text: acc.text || body.text,
          html: acc.html || body.html,
        };
      },
      { text: "", html: "" }
    );
  }

  return {
    text: decodeBase64Url(payload.body?.data),
    html: "",
  };
}