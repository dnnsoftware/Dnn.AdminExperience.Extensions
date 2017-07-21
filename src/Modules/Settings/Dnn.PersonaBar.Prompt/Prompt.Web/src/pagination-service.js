
export default class PaginationService {
    constructor(prompt){
        this.prompt = prompt;
        this.shouldPaginate = false;
        this.currentPageInfo
    }

    dump(){
        console.log(this);
    }

    isPaginationRequired(res){
        (res.pagingInfo) ? this.currentPageInfo=res.pagingInfo : null;
        this.shouldPaginate = (this.currentPageInfo) ? true : false;
        this.dump();
        return res;
    }

    nextPage(){
        let page = this.currentPageInfo;
        page.pageNo++;

        const left = () => this.prompt.runCmd(`list-modules --page ${page.pageNo} --max 2`)
        const right = () => console.log("at end");

        page.pageNo < page.totalPages ? left() : right();
        
    }

}