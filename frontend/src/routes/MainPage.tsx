import { useEffect } from 'react';

export default function MainPage() {
  useEffect(() => {
    document.title = "Chronologue";
  }, []);

  return (
    <>
      <h2>Chronologue</h2>
      <p>Chronologue is intended to make it easy to create large language families.</p>
    </>
  )
};
