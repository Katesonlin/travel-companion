// seed.js — Pre-populated Malaysia trip data
async function ensureSeeded() {
  const trips = await getAllTrips();
  if (trips.length > 0) return;

  const tripId = uid();
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

  const daysData = [
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

  for (let i = 0; i < daysData.length; i++) {
    const dayId = uid();
    await saveDay({ id: dayId, tripId, date: daysData[i].date, dateIndex: i, notes: daysData[i].notes });
    for (let j = 0; j < daysData[i].activities.length; j++) {
      const a = daysData[i].activities[j];
      await saveActivity({ id: uid(), dayId, name: a.name, startTime: a.startTime, endTime: a.endTime, type: a.type, location: a.location, notes: a.notes, isCompleted: false, order: j });
    }
  }
  console.log('✅ Seeded Malaysia trip');
}
