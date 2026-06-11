import BracketPredictor from '@/components/BracketPredictor';
import { olympicSixes2028 } from '@/tournaments/olympic-sixes-2028';

export default function Home() {
  return (
    <main>
      <BracketPredictor tournament={olympicSixes2028} />
    </main>
  );
}