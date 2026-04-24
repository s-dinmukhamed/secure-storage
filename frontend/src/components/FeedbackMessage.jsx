function FeedbackMessage({ message, tone = "info" }) {
  if (!message) {
    return <p className="feedback" aria-live="polite" />;
  }

  return (
    <p className={`feedback ${tone}`} aria-live="polite">
      {message}
    </p>
  );
}

export default FeedbackMessage;
