export function Loading() {
  return (
    <section className="loading" data-state="idle">
      <div className="label">Loading</div>
      <div className="progress">
        <span className="value">0</span>
        <span className="unit">%</span>
      </div>
    </section>
  );
}
