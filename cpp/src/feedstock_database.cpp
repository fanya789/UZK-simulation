#include "feedstock_database.hpp"
#include <algorithm>

std::vector<FeedstockProperties> FeedstockDatabase::getFeedstockDatabase() {
    std::vector<FeedstockProperties> feedstocks;
    
    feedstocks.push_back({"vat-bottom", "Вакуумный остаток", 1030, 20.5, 2.8});
    feedstocks.push_back({"bitumen", "Дорожный битум", 1050, 22.0, 3.2});
    feedstocks.push_back({"fuel-residue", "Мазут", 990, 18.0, 2.0});
    feedstocks.push_back({"crude-residue", "Остаток сырой нефти", 1010, 19.5, 2.5});
    feedstocks.push_back({"heavy-oil", "Тяжелая нефть", 950, 16.0, 1.8});
    
    return feedstocks;
}

FeedstockProperties FeedstockDatabase::getFeedstockById(const std::string& id) {
    auto feedstocks = getFeedstockDatabase();
    auto it = std::find_if(feedstocks.begin(), feedstocks.end(),
        [&id](const FeedstockProperties& f) { return f.id == id; });
    
    if (it != feedstocks.end()) {
        return *it;
    }
    
    // Возвращаем сырьё по умолчанию, если не найдено
    return getDefaultFeedstock();
}

FeedstockProperties FeedstockDatabase::getDefaultFeedstock() {
    return {"vat-bottom", "Вакуумный остаток", 1030, 20.5, 2.8};
}
