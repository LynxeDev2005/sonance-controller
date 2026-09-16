import Foundation
import ExpoModulesCore
import Intents
import Network

public class PcControlNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PcControlNative")

    // Async function to send Wake-on-LAN Magic Packet
    AsyncFunction("sendWakeOnLan") { (macAddress: String, broadcastAddress: String?, port: Int?) -> [String: Any] in
      let targetBroadcast = (broadcastAddress != nil && !broadcastAddress!.isEmpty) ? broadcastAddress! : "255.255.255.255"
      let targetPort = (port != nil && port! > 0) ? UInt16(port!) : UInt16(9)

      do {
        let cleanMac = try self.sanitizeMacAddress(macAddress)
        let magicPacket = try self.createMagicPacket(from: cleanMac)
        try self.broadcastPacket(data: magicPacket, host: targetBroadcast, port: targetPort)
        
        return [
          "success": true,
          "mac": macAddress,
          "broadcast": targetBroadcast,
          "port": targetPort,
          "message": "Wake-on-LAN magic packet successfully broadcasted"
        ]
      } catch {
        return [
          "success": false,
          "mac": macAddress,
          "error": error.localizedDescription
        ]
      }
    }

    // Ping check using native socket connection to check if PC agent is online
    AsyncFunction("pingHost") { (host: String, port: Int, timeoutMs: Int?) -> [String: Any] in
      let timeout = timeoutMs ?? 1500
      let isReachable = self.checkPortReachable(host: host, port: UInt16(port), timeoutMs: timeout)
      return [
        "host": host,
        "port": port,
        "online": isReachable
      ]
    }

    // Donate Siri Shortcut Activity so iOS recognizes voice intents
    AsyncFunction("donateSiriShortcut") { (actionType: String, title: String, phrase: String) -> [String: Any] in
      DispatchQueue.main.async {
        let activity = NSUserActivity(activityType: "com.jhet.pccontrol.\(actionType)")
        activity.title = title
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.suggestedInvocationPhrase = phrase
        activity.persistentIdentifier = NSUserActivityPersistentIdentifier("pccontrol-\(actionType)")
        activity.becomeCurrent()
      }
      return ["success": true, "phrase": phrase]
    }
  }

  // MARK: - Wake-on-LAN Helpers

  private func sanitizeMacAddress(_ mac: String) throws -> [UInt8] {
    let clean = mac.replacingOccurrences(of: "[:-]", with: "", options: .regularExpression)
                   .trimmingCharacters(in: .whitespacesAndNewlines)

    guard clean.count == 12 else {
      throw NSError(domain: "PcControl", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid MAC address format: '\(mac)'. Must contain 12 hex characters."])
    }

    var bytes = [UInt8]()
    var index = clean.startIndex
    while index < clean.endIndex {
      let nextIndex = clean.index(index, offsetBy: 2)
      let byteStr = String(clean[index..<nextIndex])
      guard let byte = UInt8(byteStr, radix: 16) else {
        throw NSError(domain: "PcControl", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid hex character in MAC address: '\(byteStr)'"])
      }
      bytes.append(byte)
      index = nextIndex
    }
    return bytes
  }

  private func createMagicPacket(from macBytes: [UInt8]) throws -> [UInt8] {
    guard macBytes.count == 6 else {
      throw NSError(domain: "PcControl", code: 3, userInfo: [NSLocalizedDescriptionKey: "MAC address must be 6 bytes"])
    }

    var packet = [UInt8]()
    // 6 bytes of 0xFF
    packet.append(contentsOf: [UInt8](repeating: 0xFF, count: 6))
    // 16 repetitions of MAC address
    for _ in 0..<16 {
      packet.append(contentsOf: macBytes)
    }
    return packet
  }

  private func broadcastPacket(data: [UInt8], host: String, port: UInt16) throws {
    let sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)
    guard sock >= 0 else {
      throw NSError(domain: "PcControl", code: 4, userInfo: [NSLocalizedDescriptionKey: "Failed to create UDP socket: errno \(errno)"])
    }
    defer {
      close(sock)
    }

    var broadcastOpt: Int32 = 1
    let setOptResult = setsockopt(sock, SOL_SOCKET, SO_BROADCAST, &broadcastOpt, socklen_t(MemoryLayout<Int32>.size))
    guard setOptResult >= 0 else {
      throw NSError(domain: "PcControl", code: 5, userInfo: [NSLocalizedDescriptionKey: "Failed to enable SO_BROADCAST on socket"])
    }

    var addr = sockaddr_in()
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = port.bigEndian
    
    let inetResult = inet_pton(AF_INET, host, &addr.sin_addr)
    if inetResult <= 0 {
      // If host is invalid IP string, fallback to 255.255.255.255
      addr.sin_addr.s_addr = INADDR_BROADCAST
    }

    let sendResult = data.withUnsafeBytes { bufferPtr in
      withUnsafePointer(to: &addr) { addrPtr in
        addrPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { saPtr in
          sendto(sock, bufferPtr.baseAddress, data.count, 0, saPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
        }
      }
    }

    guard sendResult >= 0 else {
      throw NSError(domain: "PcControl", code: 6, userInfo: [NSLocalizedDescriptionKey: "Failed to send UDP packet: errno \(errno)"])
    }
  }

  private func checkPortReachable(host: String, port: UInt16, timeoutMs: Int) -> Bool {
    let sock = socket(AF_INET, SOCK_STREAM, 0)
    guard sock >= 0 else { return false }
    defer { close(sock) }

    // Make socket non-blocking for custom timeout
    let flags = fcntl(sock, F_GETFL, 0)
    _ = fcntl(sock, F_SETFL, flags | O_NONBLOCK)

    var addr = sockaddr_in()
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = port.bigEndian
    inet_pton(AF_INET, host, &addr.sin_addr)

    let connectResult = withUnsafePointer(to: &addr) { addrPtr in
      addrPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { saPtr in
        connect(sock, saPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
      }
    }

    if connectResult == 0 {
      return true
    }

    var pfd = pollfd(fd: sock, events: Int16(POLLOUT), revents: 0)
    let pollResult = poll(&pfd, 1, Int32(timeoutMs))
    if pollResult > 0 && (pfd.revents & Int16(POLLOUT)) != 0 {
      var error: Int32 = 0
      var len = socklen_t(MemoryLayout<Int32>.size)
      getsockopt(sock, SOL_SOCKET, SO_ERROR, &error, &len)
      return error == 0
    }

    return false
  }
}
