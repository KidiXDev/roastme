import { Language, RoastLevel } from './types';

export const TRANSLATIONS = {
  [Language.EN]: {
    loadingPhrases: [
      'Digging through your fake persona...',
      'Smashing through that corporate BS...',
      'Reading your cringe commit messages...',
      'Checking how much you’re flexing...',
      '"Passionate" count: way too high...',
      'Cooking your over-engineered CSS...',
      'Ego check: 100%, Skills: 0%...',
      'Smelling that "Open to Work" panic...',
      'Buzzword bingo in progress...',
      'LinkedIn "influencer" detected...',
      '"Rockstar"? More like "Groupie"...',
      'Recruiter’s ghosting you in 3, 2, 1...',
      'Too many emojis, chill out...',
      '"Humbled to announce" my ass...'
    ]
  },
  [Language.ID]: {
    loadingPhrases: [
      'Lagi ngubek-ngubek kepribadian palsu lo...',
      'Nembus topeng korporat sok asik...',
      'Baca commit message lo yang penuh dosa...',
      'Ngukur seberapa gede gaya lo...',
      'Kebanyakan kata "Passionate", mual gue...',
      'Lagi goreng CSS lo yang ribet amat...',
      'Rasio ego kegedean, skill pas-pasan...',
      'Bau-bau panik "Open to Work" nih...',
      'Lagi main bingo buzzword...',
      '"Thought leader" LinkedIn gadungan detected...',
      'Nyari kodingan ampas...',
      'Simulasi di-ghosting recruiter...',
      'Kebanyakan emoji, norak tau...',
      '"Humbled to announce" pret lah...',
      'Sabar cuy, dikit lagi...',
      'Nyari nganu di kodingan lo...',
      'Nyari celah di web lo yang berantakan...'
    ]
  }
};

export const ROAST_COLORS: Record<
  RoastLevel,
  { color: string; accentClass: string; shadow: string }
> = {
  [RoastLevel.SANTAI]: {
    color: '#00F5FF', // Neon Cyan
    accentClass: 'border-[#00F5FF] text-[#00F5FF] bg-[#00F5FF]/5',
    shadow: 'shadow-[0_0_30px_rgba(0,245,255,0.15)]'
  },
  [RoastLevel.NORMAL]: {
    color: '#BD00FF', // Electric Violet
    accentClass: 'border-[#BD00FF] text-[#BD00FF] bg-[#BD00FF]/5',
    shadow: 'shadow-[0_0_30px_rgba(189,0,255,0.15)]'
  },
  [RoastLevel.PEDES]: {
    color: '#FF3D00', // Magma Orange
    accentClass: 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/5',
    shadow: 'shadow-[0_0_30px_rgba(255,61,0,0.15)]'
  }
};

export const FireIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12,18C12,19.1 11.1,20 10,20C8.9,20 8,19.1 8,18C8,16.9 8.9,16 10,16C11.1,16 12,16.9 12,18M11,3C11,3 11,3.21 11,3.5C11,5.25 10.15,6.75 8.79,7.59C7.37,8.47 6.5,10.05 6.5,11.5C6.5,13.91 8.35,15.93 10.75,16.21C11.5,14.65 13.09,13.5 15,13.5C15.53,13.5 16.03,13.57 16.5,13.71C16.44,11.83 15.63,10.03 14,8.5C14.85,8.5 15.61,8.9 16.1,9.54C17.26,8.68 18,7.3 18,5.75C18,5.1 17.89,4.47 17.67,3.9C18.47,4.8 19,6 19,7.3C19,8.7 18.4,9.96 17.44,10.84C18.4,12.25 19,13.93 19,15.75C19,19.5 15.8,22.5 12,22.5C8.2,22.5 5,19.5 5,15.75C5,13.43 6.13,11.38 7.88,10.1C8.61,9.58 9,8.71 9,7.8C9,7.21 8.79,6.5 8.44,5.9C8.17,5.43 8,4.91 8,4.35C8,3.21 8.9,2.29 10,2.1C10.33,2.04 10.66,2 11,2V3M15,14.5C13.9,14.5 13,15.4 13,16.5C13,17.6 13.9,18.5 15,18.5C16.1,18.5 17,17.6 17,16.5C17,15.4 16.1,14.5 15,14.5Z" />
  </svg>
);
