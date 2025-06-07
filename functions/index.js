const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Firebase Admin SDK 초기화
admin.initializeApp();

/**
 * 카카오 액세스 토큰을 검증하고 Firebase Custom Token을 생성하는 함수
 */
exports.createKakaoCustomToken = functions.https.onRequest(async (req, res) => {
  // CORS 처리
  cors(req, res, async () => {
    try {
      // POST 요청만 허용
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }

      console.log("카카오 토큰 검증 시작");

      // 카카오 API를 통해 사용자 정보 가져오기
      const kakaoUserResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        }
      });

      const kakaoUser = kakaoUserResponse.data;
      console.log("카카오 사용자 정보 획득:", {
        id: kakaoUser.id,
        nickname: kakaoUser.kakao_account && kakaoUser.kakao_account.profile && kakaoUser.kakao_account.profile.nickname
      });

      // Firebase Custom Token 생성
      const uid = `kakao_${kakaoUser.id}`;
      const customClaims = {
        provider: "kakao",
        kakao_id: kakaoUser.id,
        nickname: kakaoUser.kakao_account?.profile?.nickname,
        email: kakaoUser.kakao_account?.email,
        profile_image: kakaoUser.kakao_account?.profile?.profile_image_url
      };

      const customToken = await admin.auth().createCustomToken(uid, customClaims);
      console.log("Firebase Custom Token 생성 완료");

      // Firestore에 사용자 정보 저장/업데이트
      const userRef = admin.firestore().collection("users").doc(uid);
      const userDoc = await userRef.get();

      const userData = {
        firebaseUID: uid,
        authProvider: "kakao",
        kakaoId: kakaoUser.id,
        kakaoNickname: kakaoUser.kakao_account?.profile?.nickname,
        kakaoEmail: kakaoUser.kakao_account?.email,
        kakaoProfileImageUrl: kakaoUser.kakao_account?.profile?.profile_image_url,
        displayName: kakaoUser.kakao_account?.profile?.nickname || "카카오 사용자",
        email: kakaoUser.kakao_account?.email,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (userDoc.exists) {
        // 기존 사용자 업데이트
        await userRef.update(userData);
        console.log("기존 카카오 사용자 정보 업데이트 완료");
      } else {
        // 새 사용자 생성
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        userData.preferences = {
          notifications: true,
          theme: "light",
          language: "ko",
          kakaoNotifications: true
        };
        await userRef.set(userData);
        console.log("새 카카오 사용자 정보 생성 완료");
      }

      // 성공 응답
      res.status(200).json({
        success: true,
        customToken,
        user: {
          uid,
          kakaoId: kakaoUser.id,
          nickname: kakaoUser.kakao_account?.profile?.nickname,
          email: kakaoUser.kakao_account?.email,
          profileImageUrl: kakaoUser.kakao_account?.profile?.profile_image_url
        }
      });

    } catch (error) {
      console.error("카카오 Custom Token 생성 실패:", error);
      
      let errorMessage = "카카오 로그인 처리 중 오류가 발생했습니다.";
      let statusCode = 500;

      if (error.response?.status === 401) {
        errorMessage = "유효하지 않은 카카오 액세스 토큰입니다.";
        statusCode = 401;
      } else if (error.response?.status === 403) {
        errorMessage = "카카오 API 접근 권한이 없습니다.";
        statusCode = 403;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: error.message
      });
    }
  });
});

/**
 * 카카오 사용자 정보 조회 함수
 */
exports.getKakaoUserInfo = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { uid } = req.query;

      if (!uid) {
        return res.status(400).json({ error: "UID is required" });
      }

      const userDoc = await admin.firestore().collection("users").doc(uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      res.status(200).json({
        success: true,
        user: userData
      });

    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      res.status(500).json({
        success: false,
        error: "사용자 정보 조회 중 오류가 발생했습니다."
      });
    }
  });
});