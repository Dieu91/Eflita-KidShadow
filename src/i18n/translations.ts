import { Language } from '../types';

export const translations = {
  vi: {
    appName: 'KidShadow',
    appTagline: 'Luyện tập Shadowing Tiếng Anh Tiểu Học',
    taglineSubtitle: 'Học tiếng Anh chuẩn bản xứ vui nhộn cho bé từ 6 - 12 tuổi',
    
    // Auth
    signInWithGoogle: 'Đăng nhập với Google',
    loginWelcome: 'Chào mừng các bạn nhỏ đến với KidShadow! 🚀',
    loginDesc: 'Đăng nhập bằng tài khoản Google của phụ huynh để bắt đầu hành trình nói tiếng Anh tự tin mỗi ngày nhé!',
    signingIn: 'Đang đăng nhập...',
    logout: 'Đăng xuất',
    parentAccount: 'Tài khoản Phụ huynh',
    learningIntro: 'Luyện nói tiếng Anh tự nhiên cho bé 6–12 tuổi, 15 phút mỗi lần',
    stepListen: 'Nghe',
    stepRecord: 'Ghi âm',
    stepSubmit: 'Nộp bài',
    privacySecure: 'Bảo mật thông tin',
    nurtureLove: 'Nuôi dưỡng tình yêu tiếng Anh tự nhiên',
    privacyPolicy: 'Chính sách bảo mật',
    supportZalo: 'Hỗ trợ Zalo',
    needCodeNote: 'Dành cho học viên E-Pro / EST, cần mã kích hoạt khóa học',

    // Onboarding & Profile
    completeProfileTitle: 'Hoàn tất thông tin học viên 🌟',
    completeProfileDesc: 'Ba mẹ hãy điền thông tin bên dưới để lưu tiến độ và nhận quà cho con nhé!',
    studentName: 'Tên của con',
    studentNamePlaceholder: 'Ví dụ: Bé Bảo Nam',
    parentName: 'Tên phụ huynh',
    parentNamePlaceholder: 'Ví dụ: Mẹ Thu Hà',
    phoneNumber: 'Số điện thoại liên hệ',
    phoneNumberPlaceholder: 'Ví dụ: 0912345678',
    selectLevelTitle: 'Chọn cấp độ học phù hợp với con',
    saveProfile: 'Bắt đầu học ngay!',
    saving: 'Đang lưu...',
    editProfile: 'Hồ sơ học viên',
    changeLevel: 'Đổi cấp độ',

    // My Badges
    badges: {
      myBadgesTitle: 'Huy Hiệu Của Con 🏅',
      myBadgesSubtitle: 'Hoàn thành các cột mốc để mở khóa bộ huy hiệu siêu ngầu!',
      unlockedCount: (unlocked: number, total: number) => `Đã mở khóa: ${unlocked}/${total}`,
      locked: 'Chưa mở khóa',
      unlocked: 'Đã đạt được!',
      tabInfo: 'Thông tin cá nhân',
      tabBadges: 'Bộ sưu tập Huy hiệu',
      earlyBirdTitle: 'Chú Chim Chăm Chỉ',
      earlyBirdDesc: 'Nộp bài luyện tập trước 9:00 sáng',
      weeklyStarTitle: 'Ngôi Sao Tuần',
      weeklyStarDesc: 'Đạt mục tiêu 3/3 video trong tuần',
      streakMasterTitle: 'Bậc Thầy Chuỗi',
      streakMasterDesc: 'Học liên tục chuỗi 7 buổi',
      firstStepTitle: 'Bước Chân Đầu Tiên',
      firstStepDesc: 'Hoàn thành buổi luyện tập đầu tiên',
      nightOwlTitle: 'Chiến Binh Đêm',
      nightOwlDesc: 'Hoàn thành bài luyện tập sau 20:00 tối',
      fluentSpeakerTitle: 'Nói Tự Tin',
      fluentSpeakerDesc: 'Luyện tập video kéo dài từ 45 giây trở lên',
      halfwayHeroTitle: 'Hiệp Sĩ Nửa Chặng',
      halfwayHeroDesc: 'Vượt qua 10 video bài học',
      championBadgeTitle: 'Quán Quân Shadowing',
      championBadgeDesc: 'Hoàn thành trọn vẹn 21/21 video bài học',
    },

    // Levels
    levels: {
      starter: {
        name: 'Starter',
        age: '6 - 7 tuổi',
        desc: 'Mới bắt đầu làm quen tiếng Anh, từ vựng đơn giản, phát âm chuẩn vui tươi.',
        badge: 'Khởi động'
      },
      movers: {
        name: 'Movers',
        age: '8 - 9 tuổi',
        desc: 'Đã có nền tảng cơ bản, luyện tập mẫu câu giao tiếp và hội thoại hàng ngày.',
        badge: 'Tăng tốc'
      },
      flyers: {
        name: 'Flyers',
        age: '10 - 12 tuổi',
        desc: 'Nâng cao, phát triển phản xạ tự nhiên, ngữ điệu và kể chuyện lưu loát.',
        badge: 'Bứt phá'
      }
    },

    // Navigation & Tabs
    mapTab: 'Lộ trình học',
    progressTab: 'Tiến độ học tập',
    adminTab: 'Quản trị (Admin)',
    streakDays: 'ngày liên tục',
    overallProgress: 'Hoàn thành',

    // View modes & Video gallery
    viewModeVideos: 'Video các tuần',
    viewModeMap: 'Bản đồ thử thách',
    embeddedVideosTitle: 'Nội dung Video theo Tuần 🎬',
    embeddedVideosSubtitle: 'Xem video nhúng trực tiếp và luyện nói đuổi theo từng tuần',
    watchAndPractice: 'Quay & Nộp video',
    previewLesson: 'Xem trước bài học',
    exploreWithoutLogin: 'Xem trước 21 video bài học',
    guestNotice: 'Đang xem trước bài học. Đăng nhập với Google để nộp bài và nhận huy hiệu!',

    // Map & Path
    week: 'Tuần',
    video: 'Video',
    lessonLocked: 'Hãy hoàn thành bài trước để mở khóa bài này nhé! 🔒',
    completedBadge: 'Đã hoàn thành',
    inProgressBadge: 'Đang học',
    lockedBadge: 'Chưa mở khóa',
    startPractice: 'Luyện tập ngay',
    practiceAgain: 'Luyện tập lại',

    // Lesson Modal
    lessonModalTitle: 'Luyện Shadowing',
    watchVideoPrompt: '1. Xem video mẫu và luyện nói đuổi theo từng câu nhé!',
    step1Title: 'Bước 1 – Nghe & Bắt Chước Ngữ Điệu',
    step1Rule1: 'Xem 1 lượt hiểu nội dung → Nghe từng câu → Bấm tạm dừng (Pause) → Nhắc lại câu đó.',
    step1Rule2: 'Bắt chước ngữ điệu – tốc độ – cách nhấn của video mẫu.',
    step1Rule3: 'Nếu video có từ mới, con nên nghe thêm vài lần để luyện phát âm thật chuẩn.',
    step1Tip: 'Mẹo: Bật phụ đề video và luyện từ tốc độ chậm (0.75x) → bình thường (1.0x) cho quen nhé.',
    step2GuideTitle: 'Bước 2 – Ghi Âm / Quay Video & Luyện 3 Giác Quan',
    step2GuideRule1: 'Dùng điện thoại để ghi âm hoặc quay video con nói đuổi theo bài.',
    step2GuideRule2: 'Kết hợp 3 giác quan: 👁️ Mắt nhìn chữ • 👂 Tai nghe • 👄 Miệng nói theo đúng tốc độ.',
    step2GuideRule3: 'Nghe lại bản ghi → So sánh & điều chỉnh → Tự tin nộp video ở Bước 2 bên dưới!',
    uploadVideoPrompt: '2. Nộp bài',
    uploadBtn: 'Tải video của con lên',
    uploadingFile: 'Đang tải video lên Google Drive của con...',
    extractingMetadata: 'Đang kiểm tra thời lượng video...',
    uploadSuccess: 'Nộp bài thành công! Con làm tốt lắm! 🎉',
    driveFolderNote: 'Video của con được lưu vào Google Drive của gia đình.',
    close: 'Đóng',
    confirmDriveUploadTitle: 'Xác nhận nộp bài luyện tập',
    confirmDriveUploadDesc: 'Video của con sẽ được lưu vào Google Drive của gia đình và hệ thống sẽ ghi nhận bài nộp.',
    confirmBtn: 'Đồng ý nộp bài',
    cancelBtn: 'Hủy',
    videoDuration: 'Thời lượng video',
    seconds: 'giây',
    chooseVideoFile: 'Chọn file video (mp4, mov, webm...)',
    takeOrChooseVideo: 'Chọn hoặc quay video của bé',

    // Motivational Rule-based Feedback
    feedback: {
      firstSubmission: 'Chúc mừng con đã hoàn thành buổi luyện tập đầu tiên! 🎉',
      streakMilestone: (days: number) => `Con đã học liên tục ${days} buổi rồi — kỷ luật quá đỉnh! 🔥`,
      completedFullWeek: 'Tuần này con đã hoàn thành trọn vẹn, quá tuyệt vời! 💪',
      longerDuration: 'Lần này con nói dài và tự tin hơn lần trước đó!',
      submissionMilestone: (count: number, remaining: number) => 
        `Đây là video thứ ${count} của con — còn ${remaining} video nữa là đủ điều kiện dự thi Shadowing Champion!`,
      lateSubmission: 'Muộn một chút không sao, quan trọng là con không bỏ cuộc!',
      defaultFeedback: 'Con đã hoàn thành xuất sắc buổi luyện tập hôm nay!'
    },

    // Weekly Target Reminder Toast
    weeklyReminder: {
      weekBadge: (week: number) => `Tuần ${week}`,
      missing3: 'Tuần này con chưa nộp video nào — cùng bắt đầu nhé! 💪',
      missing2: 'Con đã nộp 1/3 video tuần này, cố lên nhé!',
      missing1: 'Chỉ còn 1 video nữa là xong mục tiêu tuần này! 🔥',
      genericMissing: (completed: number, target: number) => `Con đã nộp ${completed}/${target} video tuần này, cố lên nhé!`,
      learnNowBtn: 'Học ngay',
    },

    // Progress Page
    progressTitle: 'Hồ Sơ & Tiến Độ Luyện Tập 🏆',
    completedLessons: 'Bài học đã nộp',
    currentStreak: 'Chuỗi học liên tục',
    targetLessons: 'Mục tiêu hoàn thành',
    submissionsHistory: 'Lịch sử nộp bài Shadowing',
    noSubmissionsYet: 'Con chưa nộp bài nào. Hãy bắt đầu video đầu tiên trên bản đồ nhé!',
    viewInDrive: 'Xem trên Google Drive',
    submittedAt: 'Thời gian nộp',
    lessonTopic: 'Chủ đề',

    // Champion Step 1 & 2
    championStep1Title: 'Chỉ còn 1 bước nữa để mở khóa Shadowing Champion! 🏆',
    championStep1Prompt: 'Sau 7 tuần luyện Shadowing, con đã học được gì? Video nào con thích nhất? Điều gì khó nhất khi luyện tập? Hãy đăng bài cảm nhận lên cộng đồng Eflita, gắn hashtag #shadowing #ShadowingChampion, sau đó dán link bài viết vào đây nhé!',
    postUrlPlaceholder: 'Dán đường link bài viết cảm nhận tại đây...',
    confirmPostUrlBtn: 'Xác nhận bài viết',
    championUnlockedBanner: 'Bạn đã đủ điều kiện dự thi Shadowing Champion! 🌟',
    championUnlockedSubtitle: 'Tuyệt vời! Con đã vượt qua trọn vẹn 21 thử thách và chia sẻ cảm nhận.',
    contestFormTitle: 'Đăng ký Vòng Chung Kết Shadowing Champion',
    contestRegisteredSuccess: 'Đã gửi đăng ký dự thi thành công! Ban tổ chức sẽ liên hệ qua số điện thoại của phụ huynh. Chúc con tỏa sáng!',
    registerContestBtn: 'Gửi đăng ký dự thi Vòng Chung Kết',

    // Admin Page
    adminTitle: 'Bảng Điều Khiển Quản Trị Viên (Admin)',
    filterLevel: 'Lọc theo cấp độ:',
    allLevels: 'Tất cả cấp độ',
    searchUserPlaceholder: 'Tìm theo tên học viên, phụ huynh, SĐT, email...',
    totalStudents: 'Tổng số học viên',
    qualifiedStudents: 'Đủ điều kiện dự thi',
    exportQualifiedBtn: 'Xuất danh sách đủ điều kiện (CSV)',
    colStudent: 'Học viên',
    colParent: 'Phụ huynh',
    colPhone: 'Số điện thoại',
    colLevel: 'Cấp độ',
    colProgress: 'Tiến độ',
    colWeeks: 'Tuần (1 -> 7)',
    colReflection: 'Link bài cảm nhận',
    colActions: 'Thao tác',
    noPostYet: 'Chưa nộp',
    markInvalid: 'Đánh dấu link sai',
    markPending: 'Đổi về chờ duyệt',
    seedLessonsBtn: 'Nạp 63 bài học mẫu vào Firestore',
    seedingSuccess: 'Đã nạp thành công 63 bài học mẫu!',
    seedingAlreadyDone: 'Cơ sở dữ liệu đã có đủ bài học.',
    accessDenied: 'Bạn không có quyền truy cập trang quản trị này.'
  },

  en: {
    appName: 'KidShadow',
    appTagline: 'Primary English Shadowing Practice',
    taglineSubtitle: 'Fun native-like English pronunciation for kids aged 6 - 12',
    
    // Auth
    signInWithGoogle: 'Sign in with Google',
    loginWelcome: 'Welcome children to KidShadow! 🚀',
    loginDesc: 'Sign in with a parent Google account to start the daily confident English speaking journey!',
    signingIn: 'Signing in...',
    logout: 'Sign out',
    parentAccount: 'Parent Account',
    learningIntro: 'Natural English speaking practice for kids aged 6–12, 15 minutes a time',
    stepListen: 'Listen',
    stepRecord: 'Record',
    stepSubmit: 'Submit',
    privacySecure: 'Your data is protected',
    nurtureLove: 'Nurturing a natural love for English',
    privacyPolicy: 'Privacy policy',
    supportZalo: 'Zalo support',
    needCodeNote: 'For E-Pro / EST learners — a course activation code is required',

    // Onboarding & Profile
    completeProfileTitle: 'Complete Student Profile 🌟',
    completeProfileDesc: 'Parents, please enter details below to save progress and earn rewards!',
    studentName: 'Student Name',
    studentNamePlaceholder: 'e.g. Leo Nguyen',
    parentName: 'Parent Name',
    parentNamePlaceholder: 'e.g. Sarah Miller',
    phoneNumber: 'Contact Phone Number',
    phoneNumberPlaceholder: 'e.g. +84 912 345 678',
    selectLevelTitle: 'Select Learning Level for Your Child',
    saveProfile: 'Start Learning Now!',
    saving: 'Saving...',
    editProfile: 'Student Profile',
    changeLevel: 'Change Level',

    // My Badges
    badges: {
      myBadgesTitle: 'My Badges 🏅',
      myBadgesSubtitle: 'Hit milestones to unlock awesome badges!',
      unlockedCount: (unlocked: number, total: number) => `Unlocked: ${unlocked}/${total}`,
      locked: 'Locked',
      unlocked: 'Unlocked!',
      tabInfo: 'Personal Info',
      tabBadges: 'Badge Collection',
      earlyBirdTitle: 'Early Bird',
      earlyBirdDesc: 'Complete a practice lesson before 9:00 AM',
      weeklyStarTitle: 'Weekly Star',
      weeklyStarDesc: 'Hit the 3/3 weekly target in a week',
      streakMasterTitle: 'Streak Master',
      streakMasterDesc: 'Maintain a 7-day practice streak',
      firstStepTitle: 'First Step',
      firstStepDesc: 'Complete your first ever practice lesson',
      nightOwlTitle: 'Night Owl',
      nightOwlDesc: 'Complete a practice session after 8:00 PM',
      fluentSpeakerTitle: 'Confident Speaker',
      fluentSpeakerDesc: 'Practice video duration of 45 seconds or more',
      halfwayHeroTitle: 'Halfway Hero',
      halfwayHeroDesc: 'Complete 10 lesson videos',
      championBadgeTitle: 'Shadowing Champion',
      championBadgeDesc: 'Complete all 21/21 video lessons',
    },

    // Levels
    levels: {
      starter: {
        name: 'Starter',
        age: '6 - 7 years old',
        desc: 'Beginners getting started with English, simple vocab, cheerful pronunciation.',
        badge: 'Getting Started'
      },
      movers: {
        name: 'Movers',
        age: '8 - 9 years old',
        desc: 'Basic foundations ready, practice daily sentence patterns and conversations.',
        badge: 'Speeding Up'
      },
      flyers: {
        name: 'Flyers',
        age: '10 - 12 years old',
        desc: 'Advanced level, boost natural reflexes, expressiveness and fluent storytelling.',
        badge: 'Soaring High'
      }
    },

    // Navigation & Tabs
    mapTab: 'Learning Map',
    progressTab: 'My Progress',
    adminTab: 'Admin Panel',
    streakDays: 'day streak',
    overallProgress: 'Completed',

    // View modes & Video gallery
    viewModeVideos: 'Weekly Videos',
    viewModeMap: 'Challenge Map',
    embeddedVideosTitle: 'Weekly Embedded Videos 🎬',
    embeddedVideosSubtitle: 'Watch embedded video lessons and practice shadowing week by week',
    watchAndPractice: 'Record & Submit',
    previewLesson: 'Preview Lesson',
    exploreWithoutLogin: 'Preview 21 Lessons',
    guestNotice: 'Previewing lessons. Sign in with Google to submit videos and earn badges!',

    // Map & Path
    week: 'Week',
    video: 'Video',
    lessonLocked: 'Complete previous lessons to unlock this one! 🔒',
    completedBadge: 'Completed',
    inProgressBadge: 'In Progress',
    lockedBadge: 'Locked',
    startPractice: 'Practice Now',
    practiceAgain: 'Practice Again',

    // Lesson Modal
    lessonModalTitle: 'Shadowing Practice',
    watchVideoPrompt: '1. Watch the sample video and repeat aloud sentence by sentence!',
    step1Title: 'Step 1 – Listen & Shadow Intonation',
    step1Rule1: 'Watch once to understand → Listen sentence by sentence → Pause → Repeat aloud immediately.',
    step1Rule2: 'Mimic the rhythm, pacing, and natural sentence stress of the video.',
    step1Rule3: 'If there are new words, listen a few more times to master the pronunciation.',
    step1Tip: 'Tip: Turn on subtitles and practice from slow speed (0.75x) to normal speed (1.0x).',
    step2GuideTitle: 'Step 2 – Record Video & Engage 3 Senses',
    step2GuideRule1: 'Use your phone to record your child speaking along with the whole lesson.',
    step2GuideRule2: 'Engage 3 senses: 👁️ Eyes on text • 👂 Ears listening • 👄 Mouth speaking at native pace.',
    step2GuideRule3: 'Listen back → Compare & refine → Confidently submit video in Step 2 below!',
    uploadVideoPrompt: '2. Submit Assignment',
    uploadBtn: 'Upload Child Video',
    uploadingFile: 'Uploading video to your Google Drive...',
    extractingMetadata: 'Detecting video duration...',
    uploadSuccess: 'Submitted successfully! Great job! 🎉',
    driveFolderNote: 'Your video is saved to your Google Drive.',
    close: 'Close',
    confirmDriveUploadTitle: 'Confirm Practice Submission',
    confirmDriveUploadDesc: 'Your video will be saved to your Google Drive and the app will record your submission.',
    confirmBtn: 'Agree & Submit',
    cancelBtn: 'Cancel',
    videoDuration: 'Video Duration',
    seconds: 'seconds',
    chooseVideoFile: 'Choose video file (mp4, mov, webm...)',
    takeOrChooseVideo: 'Select or record video',

    // Motivational Rule-based Feedback (exact specifications)
    feedback: {
      firstSubmission: 'Congrats on completing your very first practice! 🎉',
      streakMilestone: (days: number) => `You've practiced ${days} days in a row — amazing discipline! 🔥`,
      completedFullWeek: 'You completed this week perfectly — great job! 💪',
      longerDuration: 'You spoke longer and more confidently than last time!',
      submissionMilestone: (count: number, remaining: number) => 
        `This is your ${count}th video — only ${remaining} more to qualify for Shadowing Champion!`,
      lateSubmission: 'A little late is okay — what matters is you didn\'t give up!',
      defaultFeedback: 'Great job completing today\'s practice!'
    },

    // Weekly Target Reminder Toast
    weeklyReminder: {
      weekBadge: (week: number) => `Week ${week}`,
      missing3: 'You haven\'t submitted any videos this week — let\'s get started! 💪',
      missing2: 'You\'ve submitted 1/3 videos this week, keep it up!',
      missing1: 'Only 1 more video to reach this week\'s goal! 🔥',
      genericMissing: (completed: number, target: number) => `You've submitted ${completed}/${target} videos this week, keep it up!`,
      learnNowBtn: 'Practice Now',
    },

    // Progress Page
    progressTitle: 'Profile & Practice Progress 🏆',
    completedLessons: 'Completed Lessons',
    currentStreak: 'Continuous Streak',
    targetLessons: 'Target Goal',
    submissionsHistory: 'Shadowing Submission History',
    noSubmissionsYet: 'No submissions yet. Start your first video on the learning map!',
    viewInDrive: 'View on Google Drive',
    submittedAt: 'Submitted At',
    lessonTopic: 'Topic',

    // Champion Step 1 & 2 (exact specifications)
    championStep1Title: 'One last step to unlock Shadowing Champion! 🏆',
    championStep1Prompt: 'After 7 weeks of Shadowing practice, what did you learn? Which video did you love most? What was the hardest part? Post your thoughts on the Eflita community with hashtags #shadowing #ShadowingChampion, then paste your post link here!',
    postUrlPlaceholder: 'Paste your reflection post link here...',
    confirmPostUrlBtn: 'Confirm Post Link',
    championUnlockedBanner: 'You\'re now eligible for the Shadowing Champion contest! 🌟',
    championUnlockedSubtitle: 'Awesome! You have finished all 21 challenges and shared your reflection.',
    contestFormTitle: 'Register for Shadowing Champion Finals',
    contestRegisteredSuccess: 'Registration sent successfully! The committee will reach out via the parent phone number. Shine on!',
    registerContestBtn: 'Submit Finals Registration',

    // Admin Page
    adminTitle: 'Admin Management Dashboard',
    filterLevel: 'Filter by level:',
    allLevels: 'All Levels',
    searchUserPlaceholder: 'Search by student, parent, phone, email...',
    totalStudents: 'Total Students',
    qualifiedStudents: 'Qualified Contestants',
    exportQualifiedBtn: 'Export Qualified (CSV)',
    colStudent: 'Student',
    colParent: 'Parent',
    colPhone: 'Phone',
    colLevel: 'Level',
    colProgress: 'Progress',
    colWeeks: 'Weeks (1 -> 7)',
    colReflection: 'Reflection Post',
    colActions: 'Actions',
    noPostYet: 'Not submitted',
    markInvalid: 'Mark as Invalid',
    markPending: 'Reset to Pending',
    seedLessonsBtn: 'Seed 63 Sample Lessons to Firestore',
    seedingSuccess: 'Successfully seeded 63 sample lessons!',
    seedingAlreadyDone: 'Lessons already exist in database.',
    accessDenied: 'You do not have permission to access the admin panel.'
  }
};

export const getTranslation = (lang: Language) => translations[lang] || translations.vi;
