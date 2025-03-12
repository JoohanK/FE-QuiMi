export const errorHandler = (error: any, customMessage?: string) => {
  if (error instanceof Error) {
    console.error(customMessage || "An error occurred:", error.message);
    alert((customMessage || "Failed: ") + error.message);
  } else {
    console.error(customMessage || "An error occurred:", error);
    alert(customMessage || "Failed.");
  }
};
