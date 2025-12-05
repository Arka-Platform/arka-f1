package com.arka.modules.community.service;

import com.arka.modules.community.dto.ChainActionResponse;
import com.arka.modules.community.dto.ChainParticipant;
import com.arka.modules.community.dto.ChainStoryResponse;
import com.arka.modules.community.dto.CommunityCircleResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommunityService {

  private final List<CommunityCircleResponse> circles = List.of(
      new CommunityCircleResponse(
          "south-asian-lit",
          "South Asian Lit Relay",
          "Hyper-curated swaps of contemporary fiction, translated classics, and diaspora voices across India, Pakistan, Sri Lanka, and Bangladesh.",
          "Anika Bhattacharya",
          214,
          18,
          42,
          List.of("Fiction", "Translation", "Diaspora"),
          "SA"),
      new CommunityCircleResponse(
          "climate-collective",
          "Climate Collective",
          "A circular shelf for climate nonfiction, regenerative design, and optimistic futurism—paired with quarterly micro-salons.",
          "Emmanuel Nwosu",
          168,
          11,
          29,
          List.of("Climate", "Design", "Policy"),
          "CC"),
      new CommunityCircleResponse(
          "moonlight-club",
          "Moonlight Club",
          "Late-night readers trading literary thrillers & speculative mysteries with a 7-day cadence to keep the suspense alive.",
          "Maya Ortiz",
          132,
          9,
          17,
          List.of("Thriller", "Speculative", "Night Owls"),
          "MC"),
      new CommunityCircleResponse(
          "tiny-hands",
          "Tiny Hands Exchange",
          "Parents and caregivers swapping STEM-forward picture books, Montessori kits, and tactile storyboards for ages 3-8.",
          "Jerome Lee",
          95,
          7,
          21,
          List.of("Kids", "STEM", "Montessori"),
          "TH"));

  private final Map<String, ChainStoryResponse> chainStories = new LinkedHashMap<>();
  private final Map<String, AtomicInteger> streakCounters = new LinkedHashMap<>();

  public CommunityService() {
    addChain(new ChainStoryResponse(
        "saffron-summer",
        "A Saffron Summer",
        "Chain · 12 hops",
        "Poetry Relay",
        48,
        12,
        "Bangalore → Kochi · 36h ago",
        List.of(
            new ChainParticipant("Anika Bhattacharya", "Kolkata", "sent to Maya"),
            new ChainParticipant("Maya Ortiz", "Dubai", "sent to Aarav"),
            new ChainParticipant("Aarav Menon", "Bangalore", "sent to Lila"))));
    addChain(new ChainStoryResponse(
        "biosphere",
        "Designing a Biosphere",
        "Chain · 9 hops",
        "Climate Circle",
        32,
        9,
        "Berlin → Amsterdam · 5h ago",
        List.of(
            new ChainParticipant("Emmanuel Nwosu", "Lagos", "sent to Teresa"),
            new ChainParticipant("Teresa van Dijk", "Amsterdam", "sent to Ivo"),
            new ChainParticipant("Ivo Marques", "Lisbon", "sent to Robin"))));
    addChain(new ChainStoryResponse(
        "paper-scholars",
        "Paper Scholars",
        "Chain · 15 hops",
        "Parent Relay",
        61,
        15,
        "Chennai → Pune · 2d ago",
        List.of(
            new ChainParticipant("Jerome Lee", "Singapore", "sent to Priya"),
            new ChainParticipant("Priya Deshmukh", "Pune", "sent to Tessa"),
            new ChainParticipant("Tessa Ruíz", "Madrid", "Up next"))));
  }

  private void addChain(ChainStoryResponse story) {
    chainStories.put(story.id(), story);
    streakCounters.put(story.id(), new AtomicInteger(story.streakDays()));
  }

  public List<CommunityCircleResponse> getCircles() {
    return new ArrayList<>(circles);
  }

  public List<ChainStoryResponse> getChainStories() {
    return new ArrayList<>(chainStories.values());
  }

  public ChainActionResponse pingChain(String chainId) {
    return updateChain(chainId, "Pinged by community", "pinged");
  }

  public ChainActionResponse keepChainAlive(String chainId) {
    return updateChain(chainId, "Chain kept alive by circulation team", "kept alive");
  }

  private ChainActionResponse updateChain(String chainId, String lastHop, String status) {
    ChainStoryResponse existing = chainStories.get(chainId);
    if (existing == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chain not found");
    }
    AtomicInteger streak = streakCounters.get(chainId);
    int nextStreak = streak.incrementAndGet();
    ChainStoryResponse updated = new ChainStoryResponse(
        existing.id(),
        existing.title(),
        existing.chainBadge(),
        existing.coverLabel(),
        nextStreak,
        existing.hops() + 1,
        lastHop,
        existing.participants());
    chainStories.put(chainId, updated);
    return new ChainActionResponse(chainId, status, nextStreak, lastHop);
  }
}












