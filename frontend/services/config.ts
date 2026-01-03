export const apiURL = process.env.NEXT_PUBLIC_API_URL;

export const apiUrls = {
  form: {
    getQuestions: `${apiURL}/form/get-questions`,
    step: `${apiURL}/form/step`,
  },
  session: {
    start: `${apiURL}/session/start`,
  },
  agent: {
    initialNote: `${apiURL}/agent/initial`,
    refineNote: `${apiURL}/agent/refine`,
    generateNotePdf: `${apiURL}/agent/generate-pdf`,
  },
};
