export const APPROVED_QWEN_IMAGE_MODELS = ["qwen-image-2.0-pro"] as const;
export const APPROVED_OPENAI_IMAGE_MODELS = ["gpt-image-1-mini"] as const;

export type ApprovedQwenImageModel = (typeof APPROVED_QWEN_IMAGE_MODELS)[number];
export type ApprovedOpenAiImageModel =
  (typeof APPROVED_OPENAI_IMAGE_MODELS)[number];

export function isApprovedQwenImageModel(
  model: string
): model is ApprovedQwenImageModel {
  return APPROVED_QWEN_IMAGE_MODELS.includes(model as ApprovedQwenImageModel);
}

export function isApprovedOpenAiImageModel(
  model: string
): model is ApprovedOpenAiImageModel {
  return APPROVED_OPENAI_IMAGE_MODELS.includes(
    model as ApprovedOpenAiImageModel
  );
}

export function approvedImageModelSummary() {
  return [
    `Qwen: ${APPROVED_QWEN_IMAGE_MODELS.join(", ")}`,
    `OpenAI fallback: ${APPROVED_OPENAI_IMAGE_MODELS.join(", ")}`
  ].join("; ");
}
