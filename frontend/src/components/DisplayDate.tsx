export default function DisplayDate({ date }: { date: Date }) {
  const longForm = date.toLocaleDateString("en-GB", {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
  }).replace(" at", ",");
  const shortForm = date.toLocaleDateString("en-GB", {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  return <abbr title={longForm}>{shortForm}</abbr>;
};
