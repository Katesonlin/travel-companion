// seed.js — Pre-populated data for Travel Companion
async function ensureSeeded() {
  var trips = await getAllTrips();
  if (trips.length > 0) {
    // Still seed locations/phrases if empty
    var locs = await getAllLocations();
    if (locs.length === 0) await seedLocations();
    var phrases = await getAllPhrases();
    if (phrases.length === 0) await seedPhrases();
    return;
  }

  // === Trip Data ===
  var tripId = uid();
  await saveTrip({
    id: tripId,
    name: '仙本那+吉隆坡 7天6晚',
    destination: '马来西亚',
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    travelers: 2,
    budget: 9000,
    createdAt: new Date().toISOString()
  });

  var daysData = [
    {
      date: '2026-10-01', notes: '晚上航班，提前3小时到机场。带好护照、行程单。',
      activities: [
        { name: '成都天府机场集合', startTime: '20:30', endTime: '21:30', type: 'transport', location: '成都天府国际机场', notes: '提前3小时到达，办理登机' },
        { name: '成都 → 吉隆坡', startTime: '23:55', endTime: null, type: 'transport', location: '航班', notes: '亚航，约5小时' },
      ]
    },
    {
      date: '2026-10-02', notes: '到达后从国际到达走到国内出发厅转机。仙本那酒店推荐吃海鲜。',
      activities: [
        { name: '到达吉隆坡KLIA2', startTime: '04:55', endTime: '05:30', type: 'transport', location: '吉隆坡KLIA2', notes: '办理入境，走到国内出发厅' },
        { name: '吉隆坡 → 斗湖', startTime: '09:00', endTime: '11:50', type: 'transport', location: '航班', notes: '约2小时50分' },
        { name: '接机到仙本那酒店', startTime: '12:00', endTime: '15:00', type: 'transport', location: '斗湖机场 → 仙本那', notes: '接机人员送至酒店，车程约1.5h' },
        { name: '酒店入住', startTime: '15:00', endTime: '15:30', type: 'hotel', location: '仙本那镇上精品酒店', notes: '归仙阿那亚 / 帕丽 / 海丰大酒店等' },
        { name: '自由活动', startTime: '16:00', endTime: null, type: 'other', location: '仙本那镇', notes: '可逛小镇、吃海鲜、海边清吧吹海风' },
      ]
    },
    {
      date: '2026-10-03', notes: '跳岛游第一天：马达京+邦邦岛+斑淡南。带防水袋、防晒霜、泳衣。浮潜装备船上提供。',
      activities: [
        { name: '到达上船码头', startTime: '08:30', endTime: '09:00', type: 'transport', location: '仙本那码头', notes: '集合签到' },
        { name: '拼船出发', startTime: '09:00', endTime: null, type: 'transport', location: '仙本那码头', notes: '准时出发，不要迟到' },
        { name: '马达京岛浮潜', startTime: '10:00', endTime: '10:45', type: 'attraction', location: '马达京岛', notes: '玻璃水，珊瑚和海龟，拍照打卡好地方' },
        { name: '邦邦岛浮潜', startTime: '10:45', endTime: '12:00', type: 'attraction', location: '邦邦岛', notes: '继续浮潜，追寻大海龟' },
        { name: '午餐', startTime: '12:00', endTime: '13:00', type: 'restaurant', location: '岛上', notes: '套餐含中餐' },
        { name: '斑淡南岛', startTime: '13:00', endTime: '14:00', type: 'attraction', location: '斑淡南岛', notes: '狭长沙滩，透明玻璃水，拍大片' },
        { name: '浮潜 / 自由活动', startTime: '14:00', endTime: '16:00', type: 'attraction', location: '海域', notes: '深度体验海洋之美' },
        { name: '返回仙本那', startTime: '16:00', endTime: '16:30', type: 'transport', location: '仙本那码头', notes: '结束一天行程' },
      ]
    },
    {
      date: '2026-10-04', notes: '跳岛游第二天：马布岛+卡帕莱。MWB水上度假村门票50马币（自费），推荐体验。',
      activities: [
        { name: '到达上船码头', startTime: '08:30', endTime: '09:00', type: 'transport', location: '仙本那码头', notes: '集合签到' },
        { name: '拼船出发', startTime: '09:00', endTime: null, type: 'transport', location: '仙本那码头', notes: '' },
        { name: 'MWB水上度假村参观', startTime: '09:45', endTime: '12:00', type: 'attraction', location: '马布岛 MWB水上度假村', notes: '网红度假村，门票50马币（自费），拍照打卡' },
        { name: '午餐', startTime: '12:00', endTime: '13:00', type: 'restaurant', location: '度假村游客休息区', notes: '套餐含中餐' },
        { name: '马布岛浮潜', startTime: '13:00', endTime: '14:30', type: 'attraction', location: '马布岛海域', notes: '深度体验海洋之美' },
        { name: '卡帕莱海钓/浮潜', startTime: '14:30', endTime: '15:30', type: 'attraction', location: '卡帕莱周边海域', notes: '体验海钓或浮潜' },
        { name: '返回仙本那', startTime: '15:30', endTime: '16:00', type: 'transport', location: '仙本那码头', notes: '结束跳岛行程' },
      ]
    },
    {
      date: '2026-10-05', notes: '转场日，行程轻松。到达吉隆坡后好好休息。',
      activities: [
        { name: '酒店退房', startTime: '07:00', endTime: '07:30', type: 'hotel', location: '仙本那酒店', notes: '整理行李，酒店早餐' },
        { name: '接机送斗湖机场', startTime: '07:30', endTime: '09:00', type: 'transport', location: '仙本那 → 斗湖机场', notes: '接机人员送机，车程约1.5h' },
        { name: '斗湖 → 吉隆坡', startTime: '09:15', endTime: '12:00', type: 'transport', location: '航班', notes: '约2小时45分' },
        { name: '接机到吉隆坡酒店', startTime: '12:00', endTime: '13:30', type: 'transport', location: 'KLIA2 → 吉隆坡市区', notes: '接机人员送至酒店' },
        { name: '酒店入住', startTime: '13:30', endTime: '14:00', type: 'hotel', location: '吉隆坡市区携程5钻酒店', notes: '双威太子/斯里太平洋/玛雅等' },
        { name: '自由休息', startTime: '14:00', endTime: null, type: 'other', location: '酒店 / 吉隆坡市区', notes: '休息调整，可附近逛逛' },
      ]
    },
    {
      date: '2026-10-06', notes: '吉隆坡包车一日游，中文导游10h。想去哪儿告诉导游就行。午餐和门票自费。',
      activities: [
        { name: '酒店早餐', startTime: '08:00', endTime: '09:00', type: 'restaurant', location: '酒店', notes: '' },
        { name: '中文导游接车', startTime: '10:00', endTime: null, type: 'transport', location: '酒店门口', notes: '可自行约定时间，10:00为默认' },
        { name: '独立广场 + 苏丹阿都沙末大厦', startTime: '10:30', endTime: '11:30', type: 'attraction', location: '独立广场', notes: '古典建筑打卡，吉隆坡地标' },
        { name: '吉隆坡城市画廊 + 中央艺术坊', startTime: '11:30', endTime: '12:30', type: 'attraction', location: '城市画廊', notes: '人文古迹，拍照打卡' },
        { name: '午餐', startTime: '12:30', endTime: '13:30', type: 'restaurant', location: '阿罗街 / 茨厂街', notes: '自费，推荐黄亚华小吃店等老字号' },
        { name: '茨厂街 + 阿罗街', startTime: '13:30', endTime: '15:00', type: 'attraction', location: '茨厂街', notes: '感受南洋风貌，逛吃逛吃' },
        { name: '自由活动 / 购物', startTime: '15:00', endTime: '17:30', type: 'other', location: '吉隆坡市区', notes: '可去KLCC、Pavilion等商场' },
        { name: '双子塔合影', startTime: '17:30', endTime: '18:30', type: 'attraction', location: '双子星花园广场', notes: '傍晚时分最佳拍摄时间' },
        { name: '晚餐', startTime: '18:30', endTime: '19:30', type: 'restaurant', location: '待定', notes: '自费，导游推荐' },
        { name: '返回酒店', startTime: '20:00', endTime: null, type: 'transport', location: '酒店', notes: '约晚上8点结束' },
      ]
    },
    {
      date: '2026-10-07', notes: '最后一天，根据航班时间灵活安排。航班18:00起飞，建议15:00前到机场。',
      activities: [
        { name: '酒店早餐', startTime: '08:00', endTime: '09:00', type: 'restaurant', location: '酒店', notes: '' },
        { name: '自由活动 / 收拾行李', startTime: '09:00', endTime: '12:00', type: 'other', location: '酒店 / 市区', notes: '最后逛逛或休息' },
        { name: '酒店退房', startTime: '12:00', endTime: '12:30', type: 'hotel', location: '酒店', notes: '整理行李' },
        { name: '接机送吉隆坡机场', startTime: '13:00', endTime: '15:00', type: 'transport', location: '酒店 → KLIA2', notes: '提前3小时到机场' },
        { name: '办理登机 + 安检', startTime: '15:00', endTime: '17:00', type: 'transport', location: 'KLIA2', notes: '亚航，注意行李托运' },
        { name: '吉隆坡 → 成都', startTime: '18:00', endTime: '22:30', type: 'transport', location: '航班', notes: '约4.5小时，到达天府国际机场' },
      ]
    }
  ];

  for (var i = 0; i < daysData.length; i++) {
    var dayId = uid();
    await saveDay({ id: dayId, tripId: tripId, date: daysData[i].date, dateIndex: i, notes: daysData[i].notes });
    for (var j = 0; j < daysData[i].activities.length; j++) {
      var a = daysData[i].activities[j];
      await saveActivity({
        id: uid(), dayId: dayId, name: a.name,
        startTime: a.startTime, endTime: a.endTime,
        type: a.type, location: a.location, notes: a.notes,
        isCompleted: false, order: j
      });
    }
  }

  await seedLocations();
  await seedPhrases();
  console.log('✅ Seed data loaded');
}

// === Saved Locations ===
async function seedLocations() {
  var locations = [
    // 景点
    { name: '仙本那', address: 'Semporna, Sabah, Malaysia', category: 'attraction', notes: '世界级潜水胜地，跳岛游出发地', lat: 4.4817, lng: 118.6172 },
    { name: '马达京岛', address: 'Mataking Island, Sabah, Malaysia', category: 'attraction', notes: '玻璃水浮潜，珊瑚花园和海龟，大小马达京由沙滩连接', lat: 4.4667, lng: 118.9667 },
    { name: '马布岛', address: 'Mabul Island, Sabah, Malaysia', category: 'attraction', notes: 'MWB水上度假村，巴瑶族村落，微距潜水天堂', lat: 4.2333, lng: 118.6333 },
    { name: '卡帕莱', address: 'Kapalai Island, Sabah, Malaysia', category: 'attraction', notes: '沙洲浅滩，海钓浮潜，玻璃水拍照', lat: 4.2167, lng: 118.6500 },
    { name: '邦邦岛', address: 'Pom Pom Island, Sabah, Malaysia', category: 'attraction', notes: '浮潜追海龟，白沙滩', lat: 4.5500, lng: 118.8833 },
    { name: '双子塔', address: 'Petronas Twin Towers, Kuala Lumpur', category: 'attraction', notes: '吉隆坡地标，452米，傍晚拍摄最佳', lat: 3.1578, lng: 101.7116 },
    { name: '独立广场', address: 'Merdeka Square, Kuala Lumpur', category: 'attraction', notes: '苏丹阿都沙末大厦，历史性地标', lat: 3.1489, lng: 101.6933 },
    { name: '茨厂街', address: 'Petaling Street, Chinatown, Kuala Lumpur', category: 'attraction', notes: '唐人街，夜市小吃，南洋风貌', lat: 3.1438, lng: 101.6972 },
    { name: '阿罗街', address: 'Jalan Alor, Kuala Lumpur', category: 'attraction', notes: '吉隆坡最著名的美食街，黄亚华烤鸡翅', lat: 3.1450, lng: 101.7086 },
    // 餐厅
    { name: '黄亚华小吃店', address: 'Jalan Alor, Kuala Lumpur', category: 'restaurant', notes: '招牌烤鸡翅、炒粿条，茨厂街老字号', lat: 3.1453, lng: 101.7089 },
    { name: '新峰肉骨茶', address: 'Jalan Balau, Kuala Lumpur', category: 'restaurant', notes: '正宗巴生肉骨茶，本地人推荐', lat: 3.0833, lng: 101.4500 },
    // 住宿
    { name: '仙本那镇精品酒店', address: 'Semporna Town, Sabah', category: 'hotel', notes: '归仙阿那亚/帕丽/海丰大酒店，近码头', lat: 4.4817, lng: 118.6172 },
    { name: '吉隆坡市区酒店', address: 'KL City Centre, Malaysia', category: 'hotel', notes: '双威太子/斯里太平洋/玛雅等携程5钻', lat: 3.1569, lng: 101.7100 },
    // 交通
    { name: '吉隆坡KLIA2机场', address: 'KLIA2, Sepang, Selangor, Malaysia', category: 'transport', notes: '亚航专用航站楼，转机注意国内/国际区分', lat: 2.7456, lng: 101.7072 },
    { name: '斗湖机场', address: 'Tawau Airport, Sabah, Malaysia', category: 'transport', notes: '离仙本那最近的机场，车程约1.5小时', lat: 4.3137, lng: 118.1219 },
    { name: '仙本那码头', address: 'Semporna Jetty, Sabah, Malaysia', category: 'transport', notes: '跳岛游集合点，提前15分钟到达', lat: 4.4822, lng: 118.6183 },
    // 其他
    { name: 'KLCC购物中心', address: 'Suria KLCC, Kuala Lumpur', category: 'other', notes: '双子塔底层商场，购物+美食', lat: 3.1585, lng: 101.7123 },
    { name: 'Pavilion KL', address: 'Bukit Bintang, Kuala Lumpur', category: 'other', notes: '柏威年广场，高端购物，免税店', lat: 3.1489, lng: 101.7136 }
  ];

  for (var i = 0; i < locations.length; i++) {
    var l = locations[i];
    await saveLocation({
      id: 'seed-loc-' + (i + 1),
      name: l.name,
      address: l.address,
      category: l.category,
      notes: l.notes,
      lat: l.lat,
      lng: l.lng,
      tripId: null,
      createdAt: new Date().toISOString()
    });
  }
  console.log('✅ Seeded locations');
}

// === Travel Phrases ===
async function seedPhrases() {
  var categories = [
    { id: 'airport', name: '机场', icon: '✈️' },
    { id: 'hotel', name: '酒店', icon: '🏨' },
    { id: 'restaurant', name: '餐厅', icon: '🍜' },
    { id: 'transport', name: '交通', icon: '🚗' },
    { id: 'shopping', name: '购物', icon: '🛍️' },
    { id: 'emergency', name: '紧急情况', icon: '🆘' }
  ];

  var phrasesData = {
    airport: [
      { zh: '请问登机口在哪里？', en: 'Excuse me, where is the boarding gate?' },
      { zh: '我的航班延误了吗？', en: 'Has my flight been delayed?' },
      { zh: '行李转盘在哪里？', en: 'Where is the baggage carousel?' },
      { zh: '我找不到我的行李了', en: 'I can\'t find my luggage' },
      { zh: '请问在哪里办理登机？', en: 'Where can I check in?' },
      { zh: '行李托运在哪里？', en: 'Where is baggage drop-off?' },
      { zh: '免税店在哪里？', en: 'Where is the duty-free shop?' },
      { zh: '我需要一张登机牌', en: 'I need a boarding pass' },
      { zh: '这个航班在哪里转机？', en: 'Where do I transfer for this flight?' },
      { zh: '请问洗手间在哪里？', en: 'Excuse me, where is the restroom?' }
    ],
    hotel: [
      { zh: '我有一个预订', en: 'I have a reservation' },
      { zh: '请问WiFi密码是什么？', en: 'What is the WiFi password?' },
      { zh: '退房时间是几点？', en: 'What time is checkout?' },
      { zh: '可以帮我叫一辆出租车吗？', en: 'Could you call a taxi for me?' },
      { zh: '早餐在哪里吃？', en: 'Where is breakfast served?' },
      { zh: '房间里的空调坏了', en: 'The air conditioning doesn\'t work' },
      { zh: '可以多给我一条毛巾吗？', en: 'Can I have an extra towel?' },
      { zh: '寄存行李在哪里？', en: 'Where can I store my luggage?' },
      { zh: '附近有什么推荐的餐厅？', en: 'Any restaurant recommendations nearby?' },
      { zh: '请帮我叫醒我，谢谢', en: 'Could you give me a wake-up call, please?' }
    ],
    restaurant: [
      { zh: '请问有菜单吗？', en: 'May I see the menu, please?' },
      { zh: '这个菜辣吗？', en: 'Is this dish spicy?' },
      { zh: '我对坚果过敏', en: 'I\'m allergic to nuts' },
      { zh: '买单，谢谢', en: 'Check, please' },
      { zh: '可以打包吗？', en: 'Can I get this to go?' },
      { zh: '推荐什么菜？', en: 'What do you recommend?' },
      { zh: '这个是什么？', en: 'What is this?' },
      { zh: '不要辣的', en: 'No spicy, please' },
      { zh: '请给我一杯水', en: 'Can I have a glass of water, please?' },
      { zh: '可以刷卡吗？', en: 'Can I pay by card?' }
    ],
    transport: [
      { zh: '请打表', en: 'Please use the meter' },
      { zh: '到这个地方多少钱？', en: 'How much to go to this place?' },
      { zh: '请在这里停车', en: 'Please stop here' },
      { zh: '地铁站怎么走？', en: 'How do I get to the subway station?' },
      { zh: '我要去机场', en: 'I want to go to the airport' },
      { zh: '附近有公交车站吗？', en: 'Is there a bus stop nearby?' },
      { zh: '大概多长时间能到？', en: 'How long will it take to get there?' },
      { zh: '可以帮我叫一辆Grab吗？', en: 'Could you help me book a Grab?' },
      { zh: '这趟列车去市中心吗？', en: 'Does this train go to the city center?' },
      { zh: '在哪里买交通卡？', en: 'Where can I buy a transit card?' }
    ],
    shopping: [
      { zh: '这个多少钱？', en: 'How much is this?' },
      { zh: '可以便宜一点吗？', en: 'Can you give me a discount?' },
      { zh: '有其他颜色吗？', en: 'Do you have other colors?' },
      { zh: '可以试穿吗？', en: 'Can I try this on?' },
      { zh: '我要这个', en: 'I\'ll take this one' },
      { zh: '可以退税吗？', en: 'Can I get a tax refund?' },
      { zh: '在哪里可以退税？', en: 'Where can I get a tax refund?' },
      { zh: '有大一号的吗？', en: 'Do you have a bigger size?' },
      { zh: '可以刷卡吗？', en: 'Can I pay by credit card?' },
      { zh: '退货政策是什么？', en: 'What is your return policy?' }
    ],
    emergency: [
      { zh: '请帮我叫救护车！', en: 'Please call an ambulance!' },
      { zh: '我迷路了', en: 'I\'m lost' },
      { zh: '我的护照丢了', en: 'I lost my passport' },
      { zh: '请帮我报警', en: 'Please call the police' },
      { zh: '我需要看医生', en: 'I need to see a doctor' },
      { zh: '最近的医院在哪里？', en: 'Where is the nearest hospital?' },
      { zh: '我被偷了', en: 'I\'ve been robbed' },
      { zh: '我钱包丢了', en: 'I lost my wallet' },
      { zh: '请帮帮我', en: 'Please help me' },
      { zh: '我不会说英语', en: 'I don\'t speak English' },
      { zh: '请说慢一点', en: 'Please speak more slowly' },
      { zh: '中国大使馆在哪里？', en: 'Where is the Chinese Embassy?' }
    ]
  };

  var counter = 0;
  for (var ci = 0; ci < categories.length; ci++) {
    var cat = categories[ci];
    var phrases = phrasesData[cat.id] || [];
    for (var pi = 0; pi < phrases.length; pi++) {
      counter++;
      await savePhrase({
        id: 'seed-phrase-' + String(counter).padStart(3, '0'),
        category: cat.id,
        zh: phrases[pi].zh,
        en: phrases[pi].en,
        isFavorite: false
      });
    }
  }
  console.log('✅ Seeded ' + counter + ' phrases');
}
