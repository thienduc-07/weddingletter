/**
 * WEDDING CONTENT CONFIGURATION
 * -------------------------------------------------------------
 * The Rose Envelope · An Ultra-Premium 3D Wedding Invitation
 * 
 * This file is the single source of truth for all editable text,
 * dates, venue details, colors, story, gallery, and interactions.
 * 
 * To customize the wedding invitation, modify the values below.
 * Changes here automatically populate the entire experience.
 */

export const weddingContent = {
  // Primary language: 'vi' (Vietnamese) or 'en' (English)
  language: 'vi',

  // Couple Information
  couple: {
    partnerOne: 'Thiên Đức',
    partnerTwo: 'Phương Anh',
    initials: 'Đ & A',
    monogram: 'Đ · A',
    partnerOneRole: 'Chú rể',
    partnerTwoRole: 'Cô dâu',
    parentsGroom: 'Gia đình Nhà Trai',
    parentsBride: 'Gia đình Nhà Gái',
  },

  // Wedding Ceremony & Reception Timings
  wedding: {
    date: '20.12.2026',
    dateDisplay: 'Chủ Nhật, 20 Tháng 12, 2026',
    dateISO: '2026-12-20',
    ceremonyTime: '15:30',
    receptionTime: '18:00',
    timeline: [
      {
        time: '15:00',
        title: 'Đón Khách & Trà Chiều',
        description: 'Thưởng thức trà thảo mộc, âm nhạc acoustic và chụp ảnh kỷ niệm tại vườn hồng.',
      },
      {
        time: '15:30',
        title: 'Lễ Thành Hôn',
        description: 'Khoảnh khắc trao lời thề nguyện thiêng liêng dưới vòm hoa hồng.',
      },
      {
        time: '17:00',
        title: 'Tiệc Cocktail Hoàng Hôn',
        description: 'Khai vị nhẹ nhàng, ngắm hoàng hôn và trò chuyện cùng cô dâu chú rể.',
      },
      {
        time: '18:00',
        title: 'Tiệc Cưới Thân Mật',
        description: 'Bữa tối ấm cúng cùng những chia sẻ đong đầy yêu thương và điệu khiêu vũ đầu tiên.',
      },
    ],
  },

  // Venue Information
  venue: {
    name: 'The Garden Wedding',
    subName: 'Khu Vườn Cổ Tích Giữa Lòng Thành Phố',
    address: '123 Đường Hoa Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    mapUrl: 'https://maps.google.com/?q=The+Garden+Wedding+Ho+Chi+Minh',
    dressCode: 'Trang phục trang nhã (Pastel, Champagne, Ivory, Terracotta)',
    notes: 'Khuôn viên có bãi đỗ xe ô tô và xe máy miễn phí với dịch vụ valet parking.',
  },

  // Invitation Card Text
  invitation: {
    eyebrow: 'TRÂN TRỌNG KÍNH MỜI',
    heading: 'Lễ Thành Hôn',
    subheading: 'WEDDING INVITATION',
    message: 'Với niềm hạnh phúc và tình yêu thương, chúng tôi trân trọng kính mời bạn và người thương đến chung vui trong ngày đặc biệt nhất của cuộc đời chúng tôi.',
    honorMessage: 'Sự hiện diện của bạn là món quà ý nghĩa nhất và là niềm vinh hạnh lớn cho hai bên gia đình.',
    closing: 'Chúng tôi rất mong được cùng bạn lưu giữ khoảnh khắc ngọt ngào này.',
    quote: '“Tình yêu không phải là nhìn nhau, mà là cùng nhìn về một hướng.”',
    quoteAuthor: 'Antoine de Saint-Exupéry',
  },

  // Design Tokens & Visual Mood
  design: {
    background: '#FFF8F8',
    surface: '#FFFCF7',
    envelopePink: '#F5DADD',
    paperWhite: '#FFFDFB',
    gold: '#D8BE86',
    goldHighlight: '#F8E8B0',
    ink: '#49373A',
    mutedInk: '#8B7478',
  },

  // Interactive Behavior Parameters
  interaction: {
    sealHoldDuration: 1500, // Duration in milliseconds to hold wax seal (1.5 seconds)
    enablePointerTilt: true, // 3D tilt tracking cursor on desktop
    enableAmbientPetals: true, // Romantic falling rose petals
    enableSound: false, // Optional ambient chime on opening (strictly user-initiated)
    enableReplay: true, // Allow restarting the envelope reveal
  },

  // Editorial Love Story
  story: {
    title: 'Câu Chuyện Của Chúng Tôi',
    subtitle: 'A Journey of Five Beautiful Years',
    lead: 'Từ một buổi chiều mưa tháng Mười một nơi góc quán quen, cho đến lời hứa trọn đời dưới bầu trời đầy sao Đà Lạt.',
    chapters: [
      {
        year: '2021',
        title: 'Lời chào đầu tiên',
        text: 'Một buổi chiều mùa thu dịu dàng ở Sài Gòn, hai tâm hồn tình cờ tìm thấy nhau qua một tách cà phê và câu chuyện chưa từng dứt.',
      },
      {
        year: '2023',
        title: 'Những chuyến đi cùng nhau',
        text: 'Từ những dặm đường đèo sương mù Tây Bắc đến những bãi cát vàng biển miền Trung, nhận ra nơi đâu có người kia, nơi đó chính là nhà.',
      },
      {
        year: '2025',
        title: 'Khoảnh khắc “Em đồng ý”',
        text: 'Dưới ánh hoàng hôn vàng ươm bên bờ hồ Tuyền Lâm, Nam đã ngỏ lời và Minh Anh đã mỉm cười gật đầu trong niềm xúc động vô bờ.',
      },
    ],
  },

  // Photographic and Media Assets
  assets: {
    heroImage: 'assets/images/garden-venue.jpg',
    couplePhotoPrimary: 'assets/images/couple-portrait.jpg',
    couplePhotoSecondary: 'assets/images/couple-candid.jpg',
    gallery: [
      {
        src: 'assets/images/gallery-1.jpg',
        alt: 'Minh Anh & Hoàng Nam tại Đà Lạt',
        caption: 'Buổi chiều hoàng hôn tại Đà Lạt',
      },
      {
        src: 'assets/images/gallery-2.jpg',
        alt: 'Nụ cười hạnh phúc ngày đính hôn',
        caption: 'Hạnh phúc giản dị bên nhau',
      },
      {
        src: 'assets/images/gallery-3.jpg',
        alt: 'Nắm tay qua từng năm tháng',
        caption: 'Nắm tay nhau đi qua tháng năm',
      },
    ],
  },

  // RSVP Form Configuration
  rsvp: {
    enabled: true,
    // Set an external RSVP link (e.g. Google Form or Wedding Site)
    // If empty or null, the built-in mailto & direct confirmation handler is used
    externalUrl: '',
    emailRecipient: 'minhanh.hoangnam2026@gmail.com',
    deadline: '05.12.2026',
    deadlineText: 'Vui lòng xác nhận trước ngày 05 tháng 12 năm 2026 để chúng tôi chuẩn bị đón tiếp chu đáo nhất.',
  },
};
