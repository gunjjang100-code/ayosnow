interface ModeNoticeProps {
  title: string;
  description: string;
}

export function ModeNotice(_props: ModeNoticeProps) {
  void _props;
  // 운영형 전환 후에는 개발 안내 배너를 화면에 노출하지 않는다.
  // 컴포넌트 이름은 남겨 두어 기존 페이지 import를 크게 갈아엎지 않고 안전하게 제거한다.
  return null;
}
