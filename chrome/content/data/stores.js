/*	
* Copyright 2005-2009 Jesse Andrews
*
* This file may be used under the terms of of the
* GNU General Public License Version 3 or later (the "GPL"),
* http://www.gnu.org/licenses/gpl.html
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*/


var stores = [
  {
    name: 'bookmooch',
    title: 'Book Mooch',
    link: 'http://bookmooch.com/detail/#{ISBN}',
    query: 'http://bookmooch.com/api/moochable?asins=#{ISBN}',
    process: function(req, isbn) {
      if (req.responseText.toLowerCase().match(isbn.toLowerCase())) {
        return 'moochable';
      } else {
        return '';
      }
    }
  },
  {
    name: 'librarything',
    title: 'Library Thing',
    link: 'http://www.librarything.com/isbn/#{ISBN}',
    process: function(req, isbn) {
      if (req.responseText.match('No works found')) {
        return '';
      }
      return 'view';
    }
  },
  {
    name: 'paperbackswap',
    title: 'PaperBackSwap',
    link: 'http://www.paperbackswap.com/book/details/#{ISBN}',
    query: 'http://www.paperbackswap.com/api/v1/index.php?RequestType=ISBNList&ISBN=#{ISBN}',
    process: function(req, isbn) {
      var result = req.responseXML.getElementsByTagName('Available');
      if ((result.length == 1) && (result[0].textContent.match('true'))) {
        return 'available';
      }
      return '';
    }
  },
  {
    name: 'shelfari',
    title: 'Shelfari',
    link: 'http://www.shelfari.com/booksearch.aspx?Adv=True&SearchAmazon=False&Title=&Author=&Isbn=#{ISBN}',
    process: function(req, isbn) {
      if (!req.responseText.match('Your search did not return any results')) {
        return 'expore';
      }
      return 'No Results';
    }
  },
  {
    name: 'abebooks',
    title: 'Abebooks',
    link: 'http://www.abebooks.com/servlet/SearchResults?sortby=2&isbn=#{ISBN}',
    affiliate_link: "http://www.abebooks.com/servlet/SearchResults?sortby=2&isbn=#{ISBN}&cm_ite=k514679",
    query: "http://www.abebooks.com/servlet/SearchResults?sortby=2&isbn=#{ISBN}",
    process: function(req) {
	return "$" + req.responseText.match(/span class="price">\D*(\d*\.\d*)/)[1];
    }
  },
  {
    name: 'alibris',
    title: 'Alibris',
//pending
//    affiliate_link: "http://click.linksynergy.com/fs-bin/click?id=KgXurF9W7K4&offerid=99238.122856000&type=2&tmpid=939&RD_PARM1=http%253A%252F%252Fwww.alibris.com/booksearch%253Fqsort%253Dp%2526qisbn%253D#{ISBN_UPCASE}",
    link: 'http://www.alibris.com/booksearch?qsort=p&qisbn=#{ISBN_UPCASE}',
    query: 'http://partnersearch.alibris.com/cgi-bin/search?site=23615740&qisbn=#{ISBN_UPCASE}',
    process: function(req) {
      var response = '';
      var prices = req.responseXML.getElementsByTagName('price');
      for (var i=0; i<prices.length; i++) {
        if (response == '') {
          response = '$' + prices[i].childNodes[0].nodeValue;
        }
        else {
          var last = parseFloat(response.slice(1));
          if (last > parseFloat(prices[i].childNodes[0].nodeValue)) {
            response = '$' + prices[i].childNodes[0].nodeValue;
          }
        }
      }
      return response;
    }
  },
  {
    name: 'betterworldbooksnew',
    title: 'Better World Books - New',
    query: "http://www.betterworldbooks.com/service.aspx?ItemId=#{ISBN_UPCASE}",
    link: 'http://www.betterworldbooks.com/detail.aspx?ItemId=#{ISBN_UPCASE}',
    process: function(req) {
      var prices = req.responseXML.getElementsByTagName('LowestNewPrice');
      var priceReturn;
      for (var i=0; i<prices.length; i++) {
        if (prices[i].parentNode.nodeName == 'OfferSummary') {
          priceReturn = prices[i].childNodes[0].nodeValue;
        }
      }
      return priceReturn;
    }
  },
  {
    name: 'betterworldbooksused',
    title: 'Better World Books - Used',
    query: "http://www.betterworldbooks.com/service.aspx?ItemId=#{ISBN_UPCASE}",
    link: 'http://www.betterworldbooks.com/detail.aspx?ItemId=#{ISBN_UPCASE}',
    process: function(req) {
      var prices = req.responseXML.getElementsByTagName('LowestUsedPrice');
      var priceReturn;
      for (var i=0; i<prices.length; i++) {
        if (prices[i].parentNode.nodeName == 'OfferSummary') {
          priceReturn = prices[i].childNodes[0].nodeValue;
        }
      }
      return priceReturn;
    }
  },
{
    name: 'amazon',
    title: 'Amazon',
    affiliate_link: "http://www.amazon.com/exec/obidos/ASIN/#{ISBN_UPCASE}/andrewsbencom-20",
    link: 'http://www.amazon.com/exec/obidos/ASIN/#{ISBN_UPCASE}',
    query: "http://bookburro.appspot.com/?isbn=#{ISBN_UPCASE}",
    process: function(req) {
      var prices = req.responseXML.getElementsByTagName('FormattedPrice');
      for (var i=0; i<prices.length; i++) {
        if (prices[i].parentNode.nodeName == 'Price') {
          return prices[i].childNodes[0].nodeValue;
        }
      }
      return '';
    }
  },
  {
    name: 'amazon_marketplace',
    title: 'Amazon Marketplace',
    affiliate_link: "http://www.amazon.com/exec/obidos/redirect?tag=andrewsbencom-20&path=tg/stores/offering/list/-/#{ISBN_UPCASE}/all/",
    link: "http://www.amazon.com/gp/offer-listing/#{ISBN_UPCASE}/",
    query: "http://bookburro.appspot.com/?isbn=#{ISBN_UPCASE}",
    process: function(req) {
      var response = '';
      var prices = req.responseXML.getElementsByTagName('FormattedPrice');
      for (var i=0; i<prices.length; i++) {
        if (prices[i].parentNode.nodeName != 'Price' &&
            prices[i].parentNode.nodeName != 'AmountSaved') {
          if (response == '') {
            response = prices[i].childNodes[0].nodeValue;
          }
          else {
            var last = parseFloat(response.slice(1));
            if (last > parseFloat(prices[i].childNodes[0].nodeValue.slice(1))) {
              response = prices[i].childNodes[0].nodeValue;
            }
          }
        }
      }
      return response;
    }
  },
  {
    name: 'booksamillion',
    title: 'Books A Million',
    link: "http://www.booksamillion.com/ncom/books?isbn=#{ISBN}",
//pending
    process: function(req) {
      if (req.responseText.match(/Not Available/)) return '';
      var price = req.responseText.match(/Club Price: ([^<]*)</);
      if (price) {
        return price[1];
      }
    }
  },
  {
    name: 'barnesnoble',
    title: 'Barnes & Noble',
    link: 'http://search.barnesandnoble.com/booksearch/isbninquiry.asp?isbn=#{ISBN}',
    affiliate_link: 'http://search.barnesandnoble.com/booksearch/isbninquiry.asp?isbn=#{ISBN}&cm_mmc=AFFILIATES-_-Linkshare-_-KgXurF9W7K4-_-10%3a1',
    query: 'http://search.barnesandnoble.com/booksearch/isbninquiry.asp?isbn=#{ISBN}',
    process: function(req) {
    try {
        return req.responseText.match(/itemprop=['"]+price['"]+>\s+(\$[0-9.]*)\s+<\/div>/)[1];
      } catch (e) {
        return "";
      }
    }
  },
  {
    name: 'barnesnoble_marketplace',
    title: 'Barnes & Noble Market',
    link: 'http://search.barnesandnoble.com/booksearch/isbninquiry.asp?isbn=#{ISBN}',
    affiliate_link: 'http://search.barnesandnoble.com/booksearch/isbninquiry.asp?isbn=#{ISBN}&cm_mmc=AFFILIATES-_-Linkshare-_-KgXurF9W7K4-_-10%3a1',
    query: 'http://search.barnesandnoble.com/booksearch/isbninquiry.asp?isbn=#{ISBN}',
    process: function(req) {
    try {
	return req.responseText.match(/<span class=['"]+marketplace-col['"]+>\s+(\$[0-9.]*)\s+<\/span>/)[1];
      } catch (e) {
	return "";
      }
    }
  },
  {
    name: 'buy',
    title: 'Buy',
    link: "http://www.buy.com/SR/SearchResults.aspx?sort=4&pv=1&qu=#{ISBN}",
    affiliate_line: "http://affiliate.buy.com/deeplink?id=KgXurF9W7K4&mid=36342&murl=http%3A%2F%2Fwww%2Ebuy%2Ecom%2FSR%2FSearchResults%2Easpx%3Fsort%3D4%26pv%3D1%26qu%3D#{ISBN}", 
    query: 'http://mobile.buy.com/ibuy/Search.aspx?pg=0&s=#{ISBN}',
    process: function(req) {
      if (!req.responseText.match('did not return an exact match.')) {
        var price = req.responseText.match(/class=['"]*ProductPrice['"]*>(?:<span\s*class=['"]*strike['"]*>[\$0-9.]+<\/span>)\s*(\$[0-9.]+)/);
        if (price) {
          return price[1];
        }
      }
      return '';
    }
  },
  {
    name: 'half',
    title: 'Half.com',
//pending website verification
    link:  'http://search.half.ebay.com/ws/web/HalfSearch?m=books&isbn=#{ISBN}&submit=Search',
    match: /Best[^P]*Price[^\$]*([^<)]*)</
  },
  {
    name: 'powells',
    title: 'Powells',
    link: "http://www.powells.com/biblio?isbn=#{ISBN}",
    affiliate_link: "http://www.powells.com/partner/36386/biblio/#{ISBN}?p_isbn",
    query: 'http://www.powells.com/search/linksearch?isbn=#{ISBN}',
    process: function( req ) {
    var price = '';
    var results = req.responseText.match(/\nPrice: [^\n]*/g);
    if (results) {
      for (var i=0; i<results.length; i++) {
        var currentprice = results[i].substring(8,20);
        if (i==0) {
          price = currentprice;
        } else {
          if (price - currentprice > 0) price = currentprice;
        }
      }
    }
    if (price) return '$'+price;
    return '';
    }
  }
];
