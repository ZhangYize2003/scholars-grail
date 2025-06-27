export async function generateHints(pdfText: string) {
  const prompt = `
    You are an assistant that processes educational content. 
    Given the following extracted PDF text, identify all the questions present and generate a short but helpful hint for each question.
            
    Return the response strictly in the following JSON format:
    {
      "numberOfQuestions": <number>,
      "hints": ["hint 1", "hint 2", ...]
    }

    PDF Text:
    """${pdfText}"""
   `;


  const response = await fetch('api/generate-ai', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({ body: prompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate hints.");
  }

  return await response.json();
}