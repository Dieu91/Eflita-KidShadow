import { Language } from '../types';

interface ArticulationGuide {
  targetWord: string;
  ipa: string;
  issue: string;
  praise: string;
  lips: string;
  teeth: string;
  tongue: string;
  breath: string;
  challenge: string;
}

/**
 * Phonetic & pedagogical database for standard ESL/EFL primary school topics.
 * Provides concrete, actionable teeth/lips/tongue mouth-shape guidance.
 */
const LESSON_PHONETICS: Record<string, ArticulationGuide> = {
  'School supplies': {
    targetWord: 'pencil',
    ipa: '/ˈpen.səl/',
    issue: 'Âm đuôi /l/ (dark L) ở cuối từ "pencil" và âm bật /k/ ở cuối từ "notebook"',
    praise: 'Con đã phát âm to, rõ ràng từ "This is my" và "colorful" với ngữ điệu rất tự nhiên và tự tin!',
    lips: 'Mở khẩu hình miệng tự nhiên, thả lỏng hai khóe môi, không mím chặt môi khi kết thúc từ.',
    teeth: 'Hai hàm răng hé mở nhẹ khoảng nửa đốt ngón tay khi đọc nguyên âm /e/, khép hờ khi chuẩn bị bật âm gió.',
    tongue: 'Khi kết thúc từ "pencil", nhẹ nhàng nâng đầu lưỡi chạm vào phần nướu phía sau hàm răng cửa trên, giữ yên đầu lưỡi một nhịp ngắn để âm /l/ vang tròn ra hai bên má.',
    breath: 'Thở đều, dứt điểm âm đuôi dứt khoát và nhẹ nhàng, không nuốt âm để câu nói rõ ràng chuẩn bản xứ.',
    challenge: 'Đứng trước gương, quan sát đầu lưỡi chạm nướu trên và luyện đọc từ "pencil" chậm rãi 3 lần nhé!',
  },
  'Art supplies': {
    targetWord: 'crayons',
    ipa: '/ˈkreɪ.ɒnz/',
    issue: 'Cụm phụ âm đầu /kr/ và âm rung /z/ ở cuối từ "crayons"',
    praise: 'Con phát âm từ "bright" và "draw pictures" rất vang, to rõ và tràn đầy năng lượng!',
    lips: 'Hơi chu môi về phía trước khi bắt đầu âm /r/, sau đó kéo nhẹ khóe môi sang hai bên sang âm /eɪ/.',
    teeth: 'Hai hàm răng khép hờ khi phát âm âm /z/ ở cuối từ để tạo độ rung nhẹ qua kẽ răng.',
    tongue: 'Uốn nhẹ đầu lưỡi lùi về sau vòm họng khi phát âm /r/, chú ý không để đầu lưỡi chạm vòm miệng.',
    breath: 'Đẩy luồng hơi rung đều qua thanh quản khi phát âm âm /z/ ở cuối từ "crayons".',
    challenge: 'Tập nói từ "crayons" trước gương, cảm nhận độ rung của âm đuôi /z/ ở cổ họng 3 lần nhé!',
  },
  'Hello': {
    targetWord: 'meet',
    ipa: '/miːt/',
    issue: 'Nguyên âm dài /iː/ và âm chặn /t/ ở cuối từ "meet"',
    praise: 'Con chào "Hello! My name is" rất tự tin, phát âm to rõ và nét mặt tươi tắn!',
    lips: 'Căng khóe môi sang hai bên như một nụ cười mỉm khi phát âm nguyên âm /iː/.',
    teeth: 'Hai hàm răng gần như khép hờ, cách nhau một khoảng rất nhỏ.',
    tongue: 'Nâng thân lưỡi lên cao về phía vòm miệng trên, đầu lưỡi đặt nhẹ sau răng cửa dưới.',
    breath: 'Bật nhẹ đầu lưỡi chạm nướu trên để tạo âm /t/ dứt khoát, không để âm bị hụt hơi.',
    challenge: 'Cười mỉm và nói "Nice to meet you" thật chậm 3 lần, chú ý bật âm /t/ nhẹ ở cuối câu!',
  },
  'Greeting': {
    targetWord: 'morning',
    ipa: '/ˈmɔː.nɪŋ/',
    issue: 'Âm mũi /ŋ/ ở đuôi từ "morning" và ngữ điệu câu hỏi "How are you today?"',
    praise: 'Con phát âm câu "Good morning!" rất rạng rỡ, giọng điệu thân thiện và tròn vành rõ chữ!',
    lips: 'Hơi tròn môi khi phát âm nguyên âm dài /ɔː/, sau đó thả lỏng môi tự nhiên.',
    teeth: 'Hai hàm răng hé mở tự nhiên, không cắn chặt.',
    tongue: 'Nâng phần cuống lưỡi chạm nhẹ vào vòm mềm phía sau họng để âm mũi /ŋ/ vang lên mũi.',
    breath: 'Giữ luồng hơi nhẹ nhàng thoát qua đường mũi ở âm đuôi, ngữ điệu câu hỏi lên nhẹ ở cuối.',
    challenge: 'Hãy tập nói "Good morning" trước gương và chú ý giữ khẩu hình tròn môi thật đẹp nhé!',
  },
  'First day': {
    targetWord: 'together',
    ipa: '/təˈɡeð.ər/',
    issue: 'Âm /ð/ (th hữu thanh) trong "together" và nguyên âm /e/',
    praise: 'Con phát âm "Welcome to our class" rất hào hứng và rõ ràng từng từ!',
    lips: 'Môi mở tự nhiên, thả lỏng khi đọc âm /tə/, sau đó kéo nhẹ sang hai bên.',
    teeth: 'Đưa đầu lưỡi ra giữa hai hàm răng nhẹ nhàng khi đọc âm /ð/, không cắn chặt.',
    tongue: 'Đặt đầu lưỡi chạm nhẹ cạnh dưới răng cửa trên, rung nhẹ luồng hơi qua lưỡi.',
    breath: 'Thở đều và nhẹ nhàng, tạo độ rung thanh quản khi phát âm âm /ð/.',
    challenge: 'Luyện đọc từ "together" 3 lần, chú ý đặt nhẹ đầu lưỡi giữa hai hàm răng nhé!',
  },
  'Birthday': {
    targetWord: 'birthday',
    ipa: '/ˈbɜːθ.deɪ/',
    issue: 'Âm vô thanh /θ/ ở giữa từ "birthday" và âm đuôi /k/ của từ "cake"',
    praise: 'Con hát và đọc câu chúc mừng sinh nhật rất vui vẻ, năng lượng ngập tràn!',
    lips: 'Mở miệng tự nhiên, sau đó khép hờ khi chuyển sang âm /deɪ/.',
    teeth: 'Đưa đầu lưỡi chạm nhẹ mép dưới răng cửa trên để bật luồng hơi gió nhẹ cho âm /θ/.',
    tongue: 'Đầu lưỡi phẳng, thả lỏng, không gập lưỡi quá sâu vào trong.',
    breath: 'Đẩy nhẹ luồng khí qua kẽ răng và đầu lưỡi mà không làm rung dây thanh quản.',
    challenge: 'Tập đọc "Happy birthday" 3 lần, chú ý bật nhẹ âm /θ/ thật êm tai nhé!',
  },
  'Emotions': {
    targetWord: 'excited',
    ipa: '/ɪkˈsaɪ.tɪd/',
    issue: 'Âm gió /ks/ và kết thúc /ɪd/ trong từ "excited"',
    praise: 'Con thể hiện cảm xúc rất sinh động qua giọng đọc, phát âm từ "happy" rất vang!',
    lips: 'Kéo nhẹ khóe miệng sang hai bên khi phát âm âm đôi /aɪ/.',
    teeth: 'Khép hờ hai hàm răng để tạo âm gió /s/ sắc nét, sau đó hé mở nhẹ.',
    tongue: 'Đầu lưỡi nâng chạm nướu trên khi kết thúc âm /d/.',
    breath: 'Bật hơi dứt khoát, thể hiện trọn vẹn sự hào hứng trong giọng điệu.',
    challenge: 'Cười tươi và nói câu "I feel excited" 3 lần trước gương nhé!',
  },
  'Clothes': {
    targetWord: 'jacket',
    ipa: '/ˈdʒæk.ɪt/',
    issue: 'Âm bật /dʒ/ ở đầu từ và âm bật /t/ ở cuối từ "jacket"',
    praise: 'Con gọi tên các màu sắc "red" và "blue" rất chuẩn và tự tin!',
    lips: 'Hơi chu tròn môi về phía trước khi bắt đầu âm /dʒ/.',
    teeth: 'Hai hàm răng khép gần nhau, sau đó mở nhanh khi bật luồng hơi.',
    tongue: 'Đầu lưỡi chạm vòm miệng cứng phía trước rồi bật nhẹ xuống.',
    breath: 'Bật luồng hơi kèm độ rung thanh quản cho âm /dʒ/, âm /t/ dứt khoát không ngắt quãng.',
    challenge: 'Nói từ "red jacket" 3 lần, chú ý bật âm đầu thật dứt khoát nhé!',
  },
  'Where is it?': {
    targetWord: 'where',
    ipa: '/weər/',
    issue: 'Khẩu hình chu tròn môi âm /w/ ở đầu từ và nguyên âm đôi /eə/ trong "where"',
    praise: 'Con đã phát âm câu hỏi "Where is it?" rất to, rõ ràng và ngữ điệu hỏi thăm vô cùng tự nhiên, tự tin!',
    lips: 'Chu tròn môi về phía trước khi bắt đầu âm /w/, sau đó mở rộng khóe môi sang hai bên cho nguyên âm đôi /eə/.',
    teeth: 'Hai hàm răng hé mở tự nhiên khoảng nửa đốt ngón tay, không cắn chặt.',
    tongue: 'Đầu lưỡi đặt phẳng, thân lưỡi hơi lùi về phía sau vòm họng, sau đó nâng nhẹ khi kết thúc âm.',
    breath: 'Đẩy luồng hơi nhẹ và mượt mà qua khe môi tròn, giữ giọng vang đều không bị đứt quãng.',
    challenge: 'Đứng trước gương, chu tròn môi và luyện đọc to cụm từ "Where is it?" 3 lần thật chuẩn xác nhé!',
  },
  'Where is it': {
    targetWord: 'where',
    ipa: '/weər/',
    issue: 'Khẩu hình chu tròn môi âm /w/ ở đầu từ và nguyên âm đôi /eə/ trong "where"',
    praise: 'Con đã phát âm câu hỏi "Where is it?" rất to, rõ ràng và ngữ điệu hỏi thăm vô cùng tự nhiên, tự tin!',
    lips: 'Chu tròn môi về phía trước khi bắt đầu âm /w/, sau đó mở rộng khóe môi sang hai bên cho nguyên âm đôi /eə/.',
    teeth: 'Hai hàm răng hé mở tự nhiên khoảng nửa đốt ngón tay, không cắn chặt.',
    tongue: 'Đầu lưỡi đặt phẳng, thân lưỡi hơi lùi về phía sau vòm họng, sau đó nâng nhẹ khi kết thúc âm.',
    breath: 'Đẩy luồng hơi nhẹ và mượt mà qua khe môi tròn, giữ giọng vang đều không bị đứt quãng.',
    challenge: 'Đứng trước gương, chu tròn môi và luyện đọc to cụm từ "Where is it?" 3 lần thật chuẩn xác nhé!',
  },
  'Asking and giving directions': {
    targetWord: 'directions',
    ipa: '/daɪˈrek.ʃənz/',
    issue: 'Âm đuôi /ʃənz/ và trọng âm rơi vào âm tiết thứ hai trong "directions"',
    praise: 'Con phát âm các từ chỉ phương hướng rất to, rõ và ngữ điệu dứt khoát!',
    lips: 'Hơi chu tròn môi và đẩy khóe môi nhẹ về phía trước khi phát âm âm /ʃ/.',
    teeth: 'Hai hàm răng gần như khép hờ để luồng hơi ma sát tạo âm gió /ʃ/ sắc nét.',
    tongue: 'Thân lưỡi nâng cao áp sát vòm miệng cứng, đầu lưỡi không chạm răng.',
    breath: 'Thở đều và đẩy luồng hơi mạnh qua kẽ răng ở âm /ʃ/, rung nhẹ thanh quản ở âm đuôi /z/.',
    challenge: 'Tập đọc từ "directions" 3 lần trước gương, cảm nhận luồng hơi gió ở đuôi từ nhé!',
  },
  'Where\'s the bank': {
    targetWord: 'bank',
    ipa: '/bæŋk/',
    issue: 'Âm mũi /ŋ/ kết hợp âm bật /k/ ở cuối từ "bank"',
    praise: 'Con đọc câu hỏi vị trí rất rõ ràng, giọng điệu tự nhiên và tròn vành rõ chữ!',
    lips: 'Mở rộng khẩu hình cho nguyên âm /æ/, sau đó thả lỏng môi.',
    teeth: 'Hai hàm răng hé mở tự nhiên khi nói nguyên âm, khép hờ khi chuẩn bị bật âm /k/.',
    tongue: 'Cuống lưỡi nâng cao chạm vòm mềm để tạo âm mũi /ŋ/, sau đó bật âm /k/ dứt khoát.',
    breath: 'Bật luồng hơi nhẹ qua họng cho âm /k/, không để âm đuôi bị mất.',
    challenge: 'Đứng trước gương và luyện đọc từ "bank" 3 lần, chú ý bật rõ âm /k/ ở đuôi từ nhé!',
  },
  'Where are you from': {
    targetWord: 'from',
    ipa: '/frɒm/',
    issue: 'Cụm phụ âm /fr/ và âm khép môi /m/ ở cuối từ "from"',
    praise: 'Con giới thiệu quê hương rất tự hào, giọng đọc to rõ và biểu cảm tươi tắn!',
    lips: 'Răng cửa trên chạm nhẹ môi dưới cho âm /f/, khép chặt hai môi khi kết thúc âm /m/.',
    teeth: 'Răng cửa trên đặt nhẹ lên phần trong của môi dưới.',
    tongue: 'Uốn nhẹ đầu lưỡi về sau khi chuyển sang âm /r/.',
    breath: 'Đẩy hơi qua kẽ răng và môi dưới ở âm /f/, ngân vang qua mũi ở âm /m/.',
    challenge: 'Luyện nói câu "Where are you from?" 3 lần, chú ý khép môi ở từ "from" nhé!',
  },
};

/**
 * Extracts a concise display sentence instead of dumping a long monologue.
 */
function getConciseLessonSentence(script?: string, topic?: string): string {
  if (!script) return topic || 'Luyện nói Tiếng Anh';
  // If script contains prepositions / where is it
  if (script.includes('Where is it')) return 'Where is it?';
  const clean = script.replace(/\r?\n+/g, ' ').trim();
  const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
  if (sentences.length > 0) {
    const first = sentences[0];
    return first.length > 50 ? `${first.substring(0, 50)}...` : first;
  }
  return topic || 'Luyện nói Tiếng Anh';
}

/**
 * Smart phonetic fallback for any lesson topic not explicitly in the dictionary.
 * Guaranteed to NEVER output "từ vựng trọng tâm" or "key word".
 */
function extractFallbackArticulation(topic: string, script: string): ArticulationGuide {
  const combinedText = `${topic} ${script}`.toLowerCase();
  
  if (combinedText.includes('where')) {
    return {
      targetWord: 'where',
      ipa: '/weər/',
      issue: 'Khẩu hình chu tròn môi âm /w/ ở đầu từ và nguyên âm đôi /eə/ trong "where"',
      praise: `Con đã nỗ lực luyện nói nhại theo (Shadowing) bài "${topic}" rất to, rõ ràng và biểu cảm tự tin!`,
      lips: 'Chu tròn môi về phía trước khi bắt đầu âm /w/, sau đó mở rộng khóe môi sang hai bên.',
      teeth: 'Hai hàm răng hé mở tự nhiên khoảng nửa đốt ngón tay, không cắn chặt.',
      tongue: 'Đầu lưỡi đặt phẳng, thân lưỡi hơi lùi về phía sau vòm họng.',
      breath: 'Đẩy luồng hơi nhẹ và mượt mà qua khe môi tròn, giữ giọng vang đều.',
      challenge: 'Đứng trước gương, chu tròn môi và luyện đọc từ "where" 3 lần thật to rõ nhé!',
    };
  }

  if (combinedText.includes('pencil') || combinedText.includes('school')) {
    return LESSON_PHONETICS['School supplies'];
  }

  // Look for any long English word in the text (>= 5 letters)
  const words = (script || topic)
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !['this', 'that', 'with', 'from', 'have', 'your', 'today', 'some'].includes(w.toLowerCase()));
  
  const selectedWord = words[0] || 'English';
  
  return {
    targetWord: selectedWord,
    ipa: `/${selectedWord.toLowerCase()}/`,
    issue: `Âm đuôi (ending sounds) và độ mở khẩu hình miệng khi phát âm từ "${selectedWord}"`,
    praise: `Con đã rất nỗ lực luyện nói nhại theo (Shadowing) bài "${topic}"! Con phát âm to, rõ ràng và thể hiện sự tự tin rất đáng biểu dương.`,
    lips: 'Mở khẩu hình miệng tự nhiên, thả lỏng hai khóe môi, không mím chặt môi khi kết thúc từ.',
    teeth: 'Hai hàm răng hé mở nhẹ khoảng nửa đốt ngón tay khi nói nguyên âm, khép hờ khi chuẩn bị bật âm đuôi.',
    tongue: 'Đầu lưỡi nâng nhẹ chạm nướu trên hoặc đặt phẳng tự nhiên theo từng âm tiết.',
    breath: 'Thở đều, dứt điểm âm dứt khoát và nhẹ nhàng, không gằn giọng.',
    challenge: `Con hãy đứng trước gương, quan sát chuyển động của môi và đọc lại từ "${selectedWord}" thật chậm rãi 3 lần nhé!`,
  };
}

/**
 * Generates kid-friendly 2-3 sentence pedagogical guidance for any lesson.
 * Strictly complies with the format:
 * 👏 [1 câu khen cụ thể]
 * 🎯 [1 câu chỉ ra đúng 1 điều cần sửa, dùng ngôn ngữ đời thường, TUYỆT ĐỐI không dùng IPA hay thuật ngữ hàn lâm]
 * 👄 [1 câu khẩu hình đơn giản cho Flyers nếu có]
 */
export function getDetailedPedagogicalFeedback(
  topic?: string,
  script?: string,
  language: Language = 'vi',
  level?: string
): string {
  const currentTopic = topic?.trim() || 'Luyện nói Tiếng Anh';
  const cleanScript = (script || '').trim();
  const guide = LESSON_PHONETICS[currentTopic] || extractFallbackArticulation(currentTopic, cleanScript);
  const targetWord = guide.targetWord || 'English';
  const isFlyers = level?.toLowerCase() === 'flyers';

  if (language === 'en') {
    const praise = `👏 Great job practicing today! You spoke clearly and showed wonderful confidence.`;
    const correction = `🎯 You read a little fast on the word "${targetWord}", try slowing down slightly so each word is clear!`;
    const mouthTip = isFlyers ? `\n👄 Keep your lips relaxed and shape your mouth naturally as you speak.` : '';
    return `${praise}\n${correction}${mouthTip}`;
  }

  // Vietnamese feedback (kid-friendly, direct conversational tone, NO IPA, NO academic jargon)
  const praise = `👏 Con đã rất cố gắng luyện nói câu mẫu to, rõ ràng và tràn đầy năng lượng!`;
  const correction = `🎯 Con đọc hơi nhanh ở từ "${targetWord}", thử chậm lại một chút để nghe rõ âm nhé!`;
  const mouthTip = isFlyers ? `\n👄 Con chú ý mở khẩu hình tự nhiên và thả lỏng môi khi đọc nhé!` : '';

  return `${praise}\n${correction}${mouthTip}`;
}

