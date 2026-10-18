package com.shipment.notification.sms;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class SmsService {

    @Value("${fast2sms.api.key:TgDYdO63Gohc9tNmuUsxaZrzqLB5vH7j0yFiSV8CQWfJXnKMl4bHsn0LOhkaJ5UTEpN1tj4SwlVIGFAC}")
    private String apiKey;

    public boolean sendOtpSms(String phoneNumber, String otp) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            System.err.println("[SMS] Phone number is missing, skipping SMS dispatch.");
            return false;
        }

        // Clean phone number (remove +91, spaces, dashes)
        String cleanPhone = phoneNumber.replaceAll("[^0-9]", "");
        if (cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
        }

        try {
            // Fast2SMS OTP route delivers pre-approved DLT OTP: "Your OTP is <variables_values>"
            String urlStr = "https://www.fast2sms.com/dev/bulkV2?"
                    + "authorization=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                    + "&route=otp"
                    + "&variables_values=" + URLEncoder.encode(otp, StandardCharsets.UTF_8)
                    + "&numbers=" + URLEncoder.encode(cleanPhone, StandardCharsets.UTF_8);

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setConnectTimeout(7000);
            conn.setReadTimeout(7000);

            int responseCode = conn.getResponseCode();
            BufferedReader in = new BufferedReader(new InputStreamReader(
                    responseCode >= 200 && responseCode < 300 ? conn.getInputStream() : conn.getErrorStream()
            ));
            StringBuilder response = new StringBuilder();
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();

            System.out.println("[Fast2SMS] Sent OTP " + otp + " to " + cleanPhone + " -> Response (" + responseCode + "): " + response);
            return responseCode == 200;
        } catch (Exception e) {
            System.err.println("[Fast2SMS] Error sending SMS to " + cleanPhone + ": " + e.getMessage());
            return false;
        }
    }
}