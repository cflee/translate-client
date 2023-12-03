import { json, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "translate-client" },
    { name: "description", content: "a translate-client" },
  ];
};

const getTranslation = async (
  targetLocale: "zh_SG" | "ms_SG" | "ta_SG",
  input: string,
) => {
  const response = await fetch(`https://www.sgtranslatetogether.gov.sg/api/translate?source=en_SG&target=${targetLocale}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "query": input,
    }),
  });
  if (!response.ok) {
    throw new Error(`unexpected status code in translate response: ${response.status}`);
  }
  const payload = await response.json();
  return payload;
}

const getTranslations = async (input: string) => {
  const [zh, ms, ta] = await Promise.all([
    await getTranslation("zh_SG", input),
    await getTranslation("ms_SG", input),
    await getTranslation("ta_SG", input),
  ]);
  return {
    zh_SG: zh.data.translations[0].translatedText,
    ms_SG: ms.data.translations[0].translatedText,
    ta_SG: ta.data.translations[0].translatedText,
  };
}

export const action = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const input = formData.get("input");
  if (input == null) {
    throw new Error("missing input parameter");
  }
  
  const translations = await getTranslations(input.toString());

  return json({ 
    ok: true,
    input: input.toString(),
    ...translations
  });
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const data = fetcher.data;

  const writeToClipboard = (text: string | undefined) => {
    if (text != undefined) {
      navigator.clipboard.writeText(text);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <h1>translate-client</h1>
      <h1>Input</h1>
      <fetcher.Form method="post">
        <textarea name="input" defaultValue={data ? data.input : ""}></textarea>
        <button type="submit">Translate</button>
      </fetcher.Form>
      <h2>Output</h2>
      <h3>Chinese</h3>
      <div>{data ? data.zh_SG : ""}</div>
      <button type="button" onClick={(e) => writeToClipboard(data?.zh_SG)}>Copy</button>
      <h3>Malay</h3>
      <div>{data ? data.ms_SG : ""}</div>
      <button type="button" onClick={(e) => writeToClipboard(data?.ms_SG)}>Copy</button>
      <h3>Tamil</h3>
      <div>{data ? data.ta_SG : ""}</div>
      <button type="button" onClick={(e) => writeToClipboard(data?.ta_SG)}>Copy</button>
    </div>
  );
}
